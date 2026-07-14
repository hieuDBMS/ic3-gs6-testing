-- ═══════════════════════════════════════════════════════════════════════
-- 2026-07-14 Security hardening — chạy tay qua Supabase Studio SQL editor,
-- theo đúng thứ tự các block dưới đây (top-to-bottom). Không dùng
-- supabase/migrations/ CLI chuẩn (xem docs/PROJECT_OVERVIEW.md).
--
-- THỨ TỰ DEPLOY BẮT BUỘC: chạy TOÀN BỘ file SQL này TRƯỚC khi deploy code
-- mới của ExamPage.jsx/MockExamPage.jsx/FlashcardPage.jsx/AnalyticsPage.jsx
-- và trước khi redeploy edge functions manage-purchase/register-user —
-- code mới gọi các RPC được tạo ở đây; deploy code trước sẽ lỗi
-- "function ... does not exist" cho tới khi chạy xong file này.
--
-- Sau khi chạy xong, xác nhận bằng các query "Xác nhận" ở cuối mỗi block.
-- ═══════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════
-- BLOCK 1 — Đóng lỗ hổng: mọi user đăng nhập đọc thẳng đáp án đúng
-- ═══════════════════════════════════════════════════════════════════════
-- Hiện trạng: RLS SELECT trên answers/truefalse_statements/hotspot_regions
-- cho phép BẤT KỲ user đã đăng nhập đọc toàn bộ cột (kể cả is_correct/
-- is_true), không phụ thuộc đã mua bài hay chưa, không phụ thuộc đã thi
-- hay chưa — bất kỳ ai mở DevTools gọi thẳng Supabase REST API đều đọc
-- được đáp án đúng của MỌI câu hỏi trong MỌI đề. Client code (ExamPage/
-- MockExamPage/FlashcardPage) đã được sửa để không còn tự tiện fetch field
-- này qua SELECT trực tiếp — block này đóng luôn đường vòng qua thẳng
-- REST API bằng cách siết RLS + chuyển 3 trang trên sang gọi RPC riêng.
--
-- Thiết kế: SELECT trên 3 bảng này chỉ còn cho phép (a) giáo viên, hoặc
-- (b) chính học sinh sở hữu 1 exam_attempts đã SUBMIT (không phải
-- in_progress) cho đúng exam chứa câu hỏi đó — đúng nghĩa "chỉ xem lại kết
-- quả sau khi đã nộp bài", khớp với luồng ResultPage.jsx hiện có (không
-- cần sửa ResultPage.jsx). Việc thi (ExamPage/MockExamPage) và học
-- flashcard (FlashcardPage) không đi qua đường RLS này nữa — chuyển sang 3
-- RPC SECURITY DEFINER mới bên dưới (SECURITY DEFINER bypass RLS trong dự
-- án này, giống mọi RPC nghiệp vụ khác — xem docs/DATABASE_SCHEMA.md).

-- Xoá toàn bộ policy SELECT hiện có trên 3 bảng này bằng cách dò động qua
-- pg_policies (không cần biết chính xác tên policy đang có trên DB thật).
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('answers', 'truefalse_statements', 'hotspot_regions')
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

CREATE POLICY "answers_select_teacher_or_own_submitted" ON answers FOR SELECT USING (
  is_teacher() OR EXISTS (
    SELECT 1 FROM exam_attempts ea
    JOIN questions q ON q.id = answers.question_id
    WHERE ea.user_id = auth.uid() AND ea.exam_id = q.exam_id AND ea.status != 'in_progress'
  )
);

CREATE POLICY "truefalse_statements_select_teacher_or_own_submitted" ON truefalse_statements FOR SELECT USING (
  is_teacher() OR EXISTS (
    SELECT 1 FROM exam_attempts ea
    JOIN questions q ON q.id = truefalse_statements.question_id
    WHERE ea.user_id = auth.uid() AND ea.exam_id = q.exam_id AND ea.status != 'in_progress'
  )
);

CREATE POLICY "hotspot_regions_select_teacher_or_own_submitted" ON hotspot_regions FOR SELECT USING (
  is_teacher() OR EXISTS (
    SELECT 1 FROM exam_attempts ea
    JOIN questions q ON q.id = hotspot_regions.question_id
    WHERE ea.user_id = auth.uid() AND ea.exam_id = q.exam_id AND ea.status != 'in_progress'
  )
);

-- Không đụng RLS của dragdrop_pairs — bảng này không có cột is_correct/
-- is_true (đáp án đúng của dragdrop nằm ở việc drag_content khớp
-- drop_content, cả hai đều PHẢI hiển thị được để học sinh thao tác kéo-thả).

-- RPC #1 — ExamPage.jsx: câu hỏi cho bài thi thường, KHÔNG có is_correct/is_true.
CREATE OR REPLACE FUNCTION get_exam_questions_for_attempt(p_exam_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_account_source text;
  result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;

  SELECT account_source INTO v_account_source FROM profiles WHERE id = auth.uid();
  IF v_account_source = 'SELF' AND NOT user_can_access_exam(auth.uid(), p_exam_id) THEN
    RAISE EXCEPTION 'exam_not_purchased';
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', q.id, 'content', q.content, 'image_url', q.image_url,
      'question_type', q.question_type, 'order_index', q.order_index, 'hotspot_multi', q.hotspot_multi,
      'answers', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', a.id, 'content', a.content, 'image_url', a.image_url, 'order_index', a.order_index
        ) ORDER BY a.order_index), '[]'::jsonb) FROM answers a WHERE a.question_id = q.id),
      'dragdrop_pairs', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', d.id, 'drag_content', d.drag_content, 'drag_image_url', d.drag_image_url,
          'drop_content', d.drop_content, 'drop_image_url', d.drop_image_url, 'order_index', d.order_index
        ) ORDER BY d.order_index), '[]'::jsonb) FROM dragdrop_pairs d WHERE d.question_id = q.id),
      'truefalse_statements', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', s.id, 'content', s.content, 'order_index', s.order_index
        ) ORDER BY s.order_index), '[]'::jsonb) FROM truefalse_statements s WHERE s.question_id = q.id),
      'hotspot_regions', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', h.id, 'x', h.x, 'y', h.y, 'width', h.width, 'height', h.height,
          'label', h.label, 'order_index', h.order_index
        ) ORDER BY h.order_index), '[]'::jsonb) FROM hotspot_regions h WHERE h.question_id = q.id)
    ) ORDER BY q.order_index
  ), '[]'::jsonb) INTO result
  FROM questions q
  WHERE q.exam_id = p_exam_id;

  RETURN result;
END; $$;
GRANT EXECUTE ON FUNCTION get_exam_questions_for_attempt(uuid) TO authenticated;

-- RPC #2 — MockExamPage.jsx: câu hỏi theo đúng thứ tự mock_question_ids đã
-- chốt sẵn của 1 attempt cụ thể — nhận p_attempt_id (không nhận mảng id câu
-- hỏi tuỳ ý từ client), tự tra mock_question_ids trong exam_attempts và
-- kiểm tra chủ sở hữu, tránh 1 user tự ý yêu cầu câu hỏi ngoài attempt của mình.
CREATE OR REPLACE FUNCTION get_mock_exam_questions(p_attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner uuid;
  v_question_ids uuid[];
  result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;

  SELECT user_id, mock_question_ids INTO v_owner, v_question_ids
  FROM exam_attempts WHERE id = p_attempt_id;

  IF v_owner IS NULL THEN RAISE EXCEPTION 'attempt_not_found'; END IF;
  IF v_owner != auth.uid() AND NOT is_teacher() THEN RAISE EXCEPTION 'forbidden'; END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', q.id, 'content', q.content, 'image_url', q.image_url,
      'question_type', q.question_type, 'order_index', q.order_index, 'hotspot_multi', q.hotspot_multi,
      'answers', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', a.id, 'content', a.content, 'image_url', a.image_url, 'order_index', a.order_index
        ) ORDER BY a.order_index), '[]'::jsonb) FROM answers a WHERE a.question_id = q.id),
      'dragdrop_pairs', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', d.id, 'drag_content', d.drag_content, 'drag_image_url', d.drag_image_url,
          'drop_content', d.drop_content, 'drop_image_url', d.drop_image_url, 'order_index', d.order_index
        ) ORDER BY d.order_index), '[]'::jsonb) FROM dragdrop_pairs d WHERE d.question_id = q.id),
      'truefalse_statements', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', s.id, 'content', s.content, 'order_index', s.order_index
        ) ORDER BY s.order_index), '[]'::jsonb) FROM truefalse_statements s WHERE s.question_id = q.id),
      'hotspot_regions', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', h.id, 'x', h.x, 'y', h.y, 'width', h.width, 'height', h.height,
          'label', h.label, 'order_index', h.order_index
        ) ORDER BY h.order_index), '[]'::jsonb) FROM hotspot_regions h WHERE h.question_id = q.id)
    ) ORDER BY ord.pos
  ), '[]'::jsonb) INTO result
  FROM unnest(v_question_ids) WITH ORDINALITY AS ord(qid, pos)
  JOIN questions q ON q.id = ord.qid;

  RETURN result;
END; $$;
GRANT EXECUTE ON FUNCTION get_mock_exam_questions(uuid) TO authenticated;

-- RPC #3 — FlashcardPage.jsx: CÓ is_correct/is_true (tính năng học bài, cố
-- ý cho xem đáp án sau khi trả lời) — nhưng vẫn kiểm tra đã mua bài (SELF).
CREATE OR REPLACE FUNCTION get_flashcard_questions(p_exam_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_account_source text;
  result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;

  SELECT account_source INTO v_account_source FROM profiles WHERE id = auth.uid();
  IF v_account_source = 'SELF' AND NOT user_can_access_exam(auth.uid(), p_exam_id) THEN
    RAISE EXCEPTION 'exam_not_purchased';
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', q.id, 'content', q.content, 'image_url', q.image_url,
      'question_type', q.question_type, 'order_index', q.order_index, 'hotspot_multi', q.hotspot_multi,
      'answers', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', a.id, 'content', a.content, 'image_url', a.image_url, 'is_correct', a.is_correct, 'order_index', a.order_index
        ) ORDER BY a.order_index), '[]'::jsonb) FROM answers a WHERE a.question_id = q.id),
      'dragdrop_pairs', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', d.id, 'drag_content', d.drag_content, 'drag_image_url', d.drag_image_url,
          'drop_content', d.drop_content, 'drop_image_url', d.drop_image_url, 'order_index', d.order_index
        ) ORDER BY d.order_index), '[]'::jsonb) FROM dragdrop_pairs d WHERE d.question_id = q.id),
      'truefalse_statements', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', s.id, 'content', s.content, 'is_true', s.is_true, 'order_index', s.order_index
        ) ORDER BY s.order_index), '[]'::jsonb) FROM truefalse_statements s WHERE s.question_id = q.id),
      'hotspot_regions', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', h.id, 'x', h.x, 'y', h.y, 'width', h.width, 'height', h.height,
          'is_correct', h.is_correct, 'label', h.label, 'order_index', h.order_index
        ) ORDER BY h.order_index), '[]'::jsonb) FROM hotspot_regions h WHERE h.question_id = q.id)
    ) ORDER BY q.order_index
  ), '[]'::jsonb) INTO result
  FROM questions q
  WHERE q.exam_id = p_exam_id;

  RETURN result;
END; $$;
GRANT EXECUTE ON FUNCTION get_flashcard_questions(uuid) TO authenticated;

-- Xác nhận Block 1:
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename IN ('answers','truefalse_statements','hotspot_regions') ORDER BY tablename;
-- SELECT proname FROM pg_proc WHERE proname IN ('get_exam_questions_for_attempt','get_mock_exam_questions','get_flashcard_questions');


-- ═══════════════════════════════════════════════════════════════════════
-- BLOCK 2 — Thanh toán: cộng dồn paid_amount nguyên tử (chống race
-- condition khi webhook SePay và giáo viên "Xác nhận" chạy gần như cùng lúc)
-- ═══════════════════════════════════════════════════════════════════════
-- Trước đây: manage-purchase's confirm/teacher-create và sepay-webhook đều
-- tự đọc purchases.paid_amount rồi UPDATE ở tầng edge function (2 request
-- riêng) — không khoá dòng, 2 request đọc cùng giá trị cũ sẽ ghi đè lên
-- nhau, mất 1 khoản thanh toán. RPC này dùng SELECT ... FOR UPDATE khoá
-- đúng 1 dòng purchases trong lúc tính toán + ghi, request thứ hai phải
-- đợi request thứ nhất commit xong mới đọc được giá trị mới nhất.
--
-- CHỈ gọi được từ edge function (service role) — REVOKE khỏi authenticated/
-- anon vì hàm này KHÔNG tự kiểm tra người gọi có quyền hay không (không có
-- ownership/role check bên trong), tin tưởng hoàn toàn vào việc chỉ code
-- server (đã tự kiểm tra quyền ở tầng edge function) mới gọi được.
CREATE OR REPLACE FUNCTION record_purchase_payment(
  p_purchase_id uuid, p_amount int, p_note text DEFAULT NULL, p_recorded_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_purchase purchases%ROWTYPE;
  v_required int;
  v_new_paid int;
  v_new_status text;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  SELECT * INTO v_purchase FROM purchases WHERE id = p_purchase_id FOR UPDATE;
  IF v_purchase.id IS NULL THEN
    RAISE EXCEPTION 'purchase_not_found';
  END IF;

  IF v_purchase.status = 'SUCCESS' THEN
    RETURN jsonb_build_object(
      'success', true, 'alreadySuccess', true, 'newStatus', v_purchase.status,
      'newPaid', v_purchase.paid_amount, 'remaining', 0, 'unlocked', true
    );
  END IF;

  SELECT required_amount INTO v_required FROM exams WHERE id = v_purchase.exam_id;
  v_required := COALESCE(v_required, v_purchase.required_amount);

  v_new_paid   := v_purchase.paid_amount + p_amount;
  v_new_status := CASE WHEN v_new_paid >= v_required THEN 'SUCCESS' ELSE 'PARTIAL' END;

  UPDATE purchases SET paid_amount = v_new_paid, status = v_new_status, updated_at = now()
  WHERE id = p_purchase_id;

  INSERT INTO payment_history (purchase_id, amount, note, recorded_by, payment_time)
  VALUES (p_purchase_id, p_amount, p_note, p_recorded_by, now());

  RETURN jsonb_build_object(
    'success', true, 'newStatus', v_new_status, 'newPaid', v_new_paid,
    'remaining', GREATEST(0, v_required - v_new_paid), 'unlocked', v_new_status = 'SUCCESS'
  );
END; $$;
-- REVOKE FROM PUBLIC is not enough on Supabase: newly created functions get
-- an automatic EXECUTE grant to `anon`/`authenticated` via default privileges
-- on the public schema, which PUBLIC-only revoke does not undo. Must revoke
-- from those two roles explicitly or this "service-role-only" function stays
-- callable by any logged-in user (verified live on 2026-07-14 — it was).
REVOKE ALL ON FUNCTION record_purchase_payment(uuid, int, text, uuid) FROM PUBLIC, anon, authenticated;

-- Xác nhận Block 2 (grantee phải CHỈ còn postgres/service_role):
-- SELECT proname, prosecdef FROM pg_proc WHERE proname = 'record_purchase_payment';
-- SELECT grantee, privilege_type FROM information_schema.role_routine_grants WHERE routine_name = 'record_purchase_payment';


-- ═══════════════════════════════════════════════════════════════════════
-- BLOCK 3 — Rate-limit đăng ký tài khoản tự do (register-user)
-- ═══════════════════════════════════════════════════════════════════════
-- register-user cố ý bypass rate-limit mặc định của Supabase Auth (dùng
-- admin.auth.admin.createUser) và CAPTCHA chỉ bật khi có secret — không có
-- gì chặn 1 script tạo hàng nghìn tài khoản rác. Bảng + RPC này thêm giới
-- hạn theo IP (5 lần/giờ mặc định), độc lập với CAPTCHA.
CREATE TABLE IF NOT EXISTS registration_attempts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip         text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_registration_attempts_ip_time ON registration_attempts (ip, created_at);
ALTER TABLE registration_attempts ENABLE ROW LEVEL SECURITY;
-- Không thêm policy nào — chỉ service role (edge function) chạm được bảng này.

CREATE OR REPLACE FUNCTION check_and_record_registration_attempt(p_ip text, p_max_per_hour int DEFAULT 5)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count int;
BEGIN
  -- Dọn bản ghi đã hết cửa sổ 1 giờ ngay trong lúc check — không cần cron
  -- job riêng để tránh bảng phình vô hạn.
  DELETE FROM registration_attempts WHERE created_at < now() - interval '1 hour';

  SELECT COUNT(*) INTO v_count FROM registration_attempts
  WHERE ip = p_ip AND created_at > now() - interval '1 hour';

  IF v_count >= p_max_per_hour THEN
    RETURN false;
  END IF;

  INSERT INTO registration_attempts (ip) VALUES (p_ip);
  RETURN true;
END; $$;
-- Same PUBLIC-only caveat as Block 2 above — revoke anon/authenticated explicitly too.
REVOKE ALL ON FUNCTION check_and_record_registration_attempt(text, int) FROM PUBLIC, anon, authenticated;

-- Xác nhận Block 3 (grantee phải CHỈ còn postgres/service_role):
-- SELECT proname FROM pg_proc WHERE proname = 'check_and_record_registration_attempt';
-- SELECT grantee, privilege_type FROM information_schema.role_routine_grants WHERE routine_name = 'check_and_record_registration_attempt';


-- ═══════════════════════════════════════════════════════════════════════
-- BLOCK 4 — Analytics: bổ sung filter trường/lớp/ngày còn thiếu
-- ═══════════════════════════════════════════════════════════════════════
-- get_exam_group_breakdown và get_question_wrong_stats hiện KHÔNG nhận
-- p_school_id/p_class_name (group breakdown) hoặc p_date_from/p_date_to/
-- p_school_id/p_class_name (wrong stats) — khi giáo viên lọc theo 1
-- trường trên AnalyticsPage, 2 khối này vẫn âm thầm hiện số liệu TOÀN HỆ
-- THỐNG, trông như đã lọc nhưng thực ra không. Áp DROP+CREATE (đổi chữ ký
-- tham số) theo đúng thứ tự đã dùng cho get_exam_score_distribution
-- (xem 2026-07-08_six_features.sql).

DROP FUNCTION IF EXISTS get_exam_group_breakdown(text, uuid, text, timestamptz, timestamptz, text);

CREATE FUNCTION get_exam_group_breakdown(
  p_group_by text, p_level_id uuid DEFAULT NULL, p_exam_type text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL, p_date_to timestamptz DEFAULT NULL,
  p_pass_filter text DEFAULT NULL, p_school_id text DEFAULT NULL, p_class_name text DEFAULT NULL
)
RETURNS TABLE (group_label text, total_attempts bigint, avg_score numeric, pass_pct numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher') THEN
    RAISE EXCEPTION 'forbidden: teacher role required';
  END IF;
  IF p_group_by NOT IN ('class', 'school', 'level') THEN RAISE EXCEPTION 'invalid p_group_by'; END IF;
  RETURN QUERY
  SELECT
    CASE p_group_by
      WHEN 'class' THEN COALESCE(p.class_name, '(Chưa gán lớp)')
      WHEN 'school' THEN COALESCE(s.name, '(Chưa gán trường)')
      WHEN 'level' THEN COALESCE(lv.label, '(?)')
    END,
    COUNT(*)::bigint, ROUND(AVG(ea.score), 1),
    ROUND(100.0 * COUNT(*) FILTER (WHERE ea.score >= 70) / NULLIF(COUNT(*), 0), 1)
  FROM exam_attempts ea
  JOIN exams e ON e.id = ea.exam_id
  JOIN exam_levels lv ON lv.id = e.level_id
  JOIN profiles p ON p.id = ea.user_id
  LEFT JOIN schools s ON s.id::text = p.school
  WHERE ea.status IN ('submitted', 'auto_submitted')
    AND (p_level_id IS NULL OR e.level_id = p_level_id)
    AND (p_exam_type IS NULL OR e.exam_type = p_exam_type)
    AND (p_date_from IS NULL OR ea.started_at >= p_date_from)
    AND (p_date_to IS NULL OR ea.started_at <= p_date_to)
    AND (p_pass_filter IS NULL OR p_pass_filter = 'all'
         OR (p_pass_filter = 'pass' AND ea.score >= 70)
         OR (p_pass_filter = 'fail' AND ea.score < 70))
    AND (p_school_id IS NULL OR p.school = p_school_id)
    AND (p_class_name IS NULL OR p.class_name = p_class_name)
  GROUP BY 1 ORDER BY avg_score ASC NULLS LAST;
END; $$;
GRANT EXECUTE ON FUNCTION get_exam_group_breakdown(text, uuid, text, timestamptz, timestamptz, text, text, text) TO authenticated;

DROP FUNCTION IF EXISTS get_question_wrong_stats(int, uuid, text, text);

CREATE FUNCTION get_question_wrong_stats(
  p_min_attempts int DEFAULT 5, p_level_id uuid DEFAULT NULL,
  p_exam_type text DEFAULT NULL, p_question_type text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL, p_date_to timestamptz DEFAULT NULL,
  p_school_id text DEFAULT NULL, p_class_name text DEFAULT NULL
)
RETURNS TABLE (
  question_id uuid, exam_id uuid, exam_title text, level_label text,
  exam_type text, exam_number int, question_type text, content text,
  total_attempts bigint, wrong_count bigint, wrong_pct numeric
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher') THEN
    RAISE EXCEPTION 'forbidden: teacher role required';
  END IF;
  RETURN QUERY
  SELECT q.id, q.exam_id, e.title, lv.label, e.exam_type, e.exam_number, q.question_type, q.content,
    COUNT(aa.id)::bigint,
    COUNT(aa.id) FILTER (WHERE aa.is_correct = false)::bigint,
    ROUND(100.0 * COUNT(aa.id) FILTER (WHERE aa.is_correct = false) / NULLIF(COUNT(aa.id), 0), 1)
  FROM attempt_answers aa
  JOIN questions q ON q.id = aa.question_id
  JOIN exams e ON e.id = q.exam_id
  JOIN exam_levels lv ON lv.id = e.level_id
  JOIN exam_attempts ea ON ea.id = aa.attempt_id
  JOIN profiles p ON p.id = ea.user_id
  WHERE (p_level_id IS NULL OR e.level_id = p_level_id)
    AND (p_exam_type IS NULL OR e.exam_type = p_exam_type)
    AND (p_question_type IS NULL OR q.question_type = p_question_type)
    AND (p_date_from IS NULL OR ea.started_at >= p_date_from)
    AND (p_date_to IS NULL OR ea.started_at <= p_date_to)
    AND (p_school_id IS NULL OR p.school = p_school_id)
    AND (p_class_name IS NULL OR p.class_name = p_class_name)
  GROUP BY q.id, q.exam_id, e.title, lv.label, e.exam_type, e.exam_number, q.question_type, q.content
  HAVING COUNT(aa.id) >= p_min_attempts
  ORDER BY wrong_pct DESC NULLS LAST;
END; $$;
GRANT EXECUTE ON FUNCTION get_question_wrong_stats(int, uuid, text, text, timestamptz, timestamptz, text, text) TO authenticated;

-- Xác nhận Block 4 (khi tất cả param mới = NULL, kết quả phải giống hệt bản cũ):
-- SELECT * FROM get_exam_group_breakdown('class', NULL, NULL, NULL, NULL, NULL, NULL, NULL) LIMIT 3;
-- SELECT * FROM get_question_wrong_stats(5, NULL, NULL, NULL, NULL, NULL, NULL, NULL) LIMIT 3;


-- ═══════════════════════════════════════════════════════════════════════
-- BLOCK 5 — Khoá bảng `todos` (sót lại từ template, RLS đang TẮT hoàn toàn)
-- ═══════════════════════════════════════════════════════════════════════
-- Không được app tham chiếu ở bất kỳ đâu trong src/ (xem docs/DATABASE_
-- SCHEMA.md). Bật RLS không kèm policy nào — chặn mọi truy cập qua anon/
-- authenticated key, an toàn hơn xoá bảng (vẫn giữ được dữ liệu nếu có ai
-- cần, service role vẫn truy cập bình thường).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'todos') THEN
    EXECUTE 'ALTER TABLE todos ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- Xác nhận Block 5:
-- SELECT relrowsecurity FROM pg_class WHERE relname = 'todos';
