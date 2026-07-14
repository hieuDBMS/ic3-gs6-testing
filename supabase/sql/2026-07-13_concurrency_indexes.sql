-- Indexes for hot-path queries hit concurrently by many students/teachers
-- (see docs/PATTERNS_AND_CONVENTIONS.md #22/#24 and ROUTES_AND_PAGES.md → ExamPage/LiveMonitorPage).
-- Chạy tay qua Supabase Studio SQL editor — repo này không dùng `supabase/migrations/` chuẩn CLI.
--
-- CONCURRENTLY: không khoá bảng khi tạo index, an toàn chạy trên DB đang có traffic.
-- Không chạy bên trong 1 transaction block (Supabase SQL editor mặc định chạy từng
-- statement riêng — nếu dùng client khác wrap trong BEGIN/COMMIT, tách statement CONCURRENTLY ra).

-- 1) Resume Session check (ExamPage.jsx initExam, chạy mỗi lần học sinh vào bài):
--    .eq('user_id', ...).eq('exam_id', ...).eq('status', 'in_progress').eq('is_mock', false)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exam_attempts_resume
  ON exam_attempts (user_id, exam_id, status, is_mock);

-- 2) LiveMonitorPage.fetchLive(): .eq('status', 'in_progress').gte('last_activity_at', cutoff)
--    chạy lại mỗi 500ms-1.5s khi lớp đang thi (xem scheduleRefetch debounce+maxWait)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exam_attempts_live_monitor
  ON exam_attempts (status, last_activity_at);

-- 3) exam_cheat_events lookup theo attempt_id (LiveMonitorPage cheatCounts, useExamAttempts hook)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exam_cheat_events_attempt_id
  ON exam_cheat_events (attempt_id);

-- 4) questions theo exam_id — mọi học sinh trong 1 exam fetch cùng lúc lúc bắt đầu thi
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_exam_id
  ON questions (exam_id);

-- 5) attempt_answers theo attempt_id — dùng trong ResultPage, submit RPCs, get_question_wrong_stats
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attempt_answers_attempt_id
  ON attempt_answers (attempt_id);

-- 6) attempt_answers theo question_id — dùng trong get_question_wrong_stats (group by question)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attempt_answers_question_id
  ON attempt_answers (question_id);

-- 7) purchases theo user_id — PaymentHistoryPage list-mine, manage-purchase edge function
--    (transaction_code đã có UNIQUE constraint → tự động có index, không cần thêm)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchases_user_id
  ON purchases (user_id);

-- 8) exam_attempts theo user_id — DashboardPage/useExamAttempts hook (lịch sử làm bài cá nhân)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exam_attempts_user_id
  ON exam_attempts (user_id);

-- Xác nhận sau khi chạy:
-- SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';

-- ═══════════════════════════════════════════════════════════════════════
-- RPC mới: get_student_attempt_stats() — thay useStudents.js's raw fetch
-- ═══════════════════════════════════════════════════════════════════════
-- Trước đây: hooks/useStudents.js fetch TOÀN BỘ bảng exam_attempts (mọi user,
-- không limit) mỗi lần StudentManagementPage/StudentOverviewTable mount, rồi
-- group-by/reduce client-side để tính totalAttempts/avgScore/lastActiveAt
-- theo từng học sinh. Payload này lớn dần vô hạn theo thời gian khi nhiều
-- học sinh tích luỹ lịch sử làm bài — không liên quan gì đến số học sinh
-- ĐANG xem trang, chỉ liên quan tổng lịch sử toàn hệ thống.
-- RPC này tính aggregate ngay trong Postgres, trả về 1 dòng/học sinh CÓ làm
-- bài (không phải 1 dòng/attempt) — payload nhỏ và ổn định theo số học sinh,
-- không theo số attempt.
--
-- LƯU Ý THỨ TỰ DEPLOY: chạy file SQL này TRƯỚC khi deploy code mới của
-- useStudents.js (đã sửa để gọi RPC này) — nếu deploy code trước, StudentManagementPage
-- sẽ lỗi "function get_student_attempt_stats() does not exist" cho tới khi chạy xong.
CREATE OR REPLACE FUNCTION get_student_attempt_stats()
RETURNS TABLE (user_id uuid, total_attempts bigint, avg_score numeric, last_active timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher') THEN
    RAISE EXCEPTION 'forbidden: teacher role required';
  END IF;
  RETURN QUERY
  SELECT ea.user_id, COUNT(*)::bigint, ROUND(AVG(ea.score), 1), MAX(ea.started_at)
  FROM exam_attempts ea
  WHERE ea.status != 'in_progress'
  GROUP BY ea.user_id;
END; $$;

GRANT EXECUTE ON FUNCTION get_student_attempt_stats TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- RPC mới: get_teacher_dashboard_stats() — thay useExamAttempts(null, ...)
-- ═══════════════════════════════════════════════════════════════════════
-- DashboardPage.jsx's useTeacherStats() gọi useExamAttempts(null, { select: 'score' })
-- — userId=null nghĩa là KHÔNG filter theo user, tức fetch TOÀN BỘ exam_attempts
-- toàn hệ thống mỗi lần bất kỳ giáo viên nào load trang Dashboard (trang mặc định
-- sau login) chỉ để COUNT + AVG ở client. Chạy thường xuyên hơn nhiều so với
-- get_student_attempt_stats() (StudentManagementPage) vì Dashboard là landing page.
-- RPC này trả về đúng 1 dòng (total_attempts, avg_score) — Postgres tự COUNT/AVG,
-- không kéo dữ liệu thô về client nữa.
--
-- LƯU Ý THỨ TỰ DEPLOY: chạy file SQL này TRƯỚC khi deploy code mới của
-- DashboardPage.jsx — nếu deploy code trước, mọi giáo viên load Dashboard sẽ lỗi
-- "function get_teacher_dashboard_stats() does not exist" cho tới khi chạy xong.
CREATE OR REPLACE FUNCTION get_teacher_dashboard_stats()
RETURNS TABLE (total_attempts bigint, avg_score numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher') THEN
    RAISE EXCEPTION 'forbidden: teacher role required';
  END IF;
  RETURN QUERY
  SELECT COUNT(*)::bigint, ROUND(AVG(score), 1)
  FROM exam_attempts
  WHERE status != 'in_progress';
END; $$;

GRANT EXECUTE ON FUNCTION get_teacher_dashboard_stats TO authenticated;
