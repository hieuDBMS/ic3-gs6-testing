-- ═══════════════════════════════════════════════════════════════════════
-- 2026-07-15 Gamification: streak luyện tập + bảng xếp hạng lớp/trường
-- (opt-in) — chạy tay qua Supabase Studio SQL editor, theo đúng thứ tự các
-- block dưới đây (top-to-bottom). Không dùng supabase/migrations/ CLI chuẩn
-- (xem docs/PROJECT_OVERVIEW.md).
--
-- THỨ TỰ DEPLOY BẮT BUỘC: chạy TOÀN BỘ file SQL này TRƯỚC khi deploy code
-- mới của DashboardPage.jsx/LeaderboardPage.jsx — code mới gọi các RPC được
-- tạo ở đây; deploy code trước sẽ lỗi "function ... does not exist" cho
-- tới khi chạy xong file này.
--
-- Sau khi chạy xong, xác nhận bằng các query "Xác nhận" ở cuối mỗi block.
--
-- REVISION (trước khi chạy lần đầu, cùng ngày 2026-07-15): BLOCK 4 đã sửa 2
-- vấn đề phát hiện lúc review — (a) rank/hiển thị dùng thẳng current_streak
-- thô thay vì áp lại logic "gãy chuỗi nếu nghỉ >1 ngày" (xem
-- src/utils/streak.js's getEffectiveStreak — trước đây chỉ áp ở client,
-- không áp trong SQL nên leaderboard xếp hạng sai/hiển thị lệch so với
-- Dashboard của chính user đó); (b) p_scope_value nhận thẳng từ client mà
-- không xác thực khớp lớp/trường thật của người gọi — cho phép 1 user tự
-- sửa request để xem leaderboard lớp/trường bất kỳ. Thêm BLOCK 5 (RPC lấy
-- hạng của chính mình dù không nằm trong top hiển thị) và BLOCK 6 (index).
-- ═══════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════
-- BLOCK 1 — Cột mới trên `profiles`: streak + cờ opt-in bảng xếp hạng
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS current_streak     int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak     int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_streak_date   date,
  ADD COLUMN IF NOT EXISTS leaderboard_opt_in boolean NOT NULL DEFAULT false;

-- AuthContext.jsx's fetchProfile() đã select('*') trên profiles — 4 cột
-- mới tự động có sẵn trong `profile` object phía client, không cần sửa
-- AuthContext.

-- Xác nhận Block 1:
-- SELECT column_name, data_type, column_default FROM information_schema.columns
--   WHERE table_name = 'profiles' AND column_name IN
--   ('current_streak','longest_streak','last_streak_date','leaderboard_opt_in');


-- ═══════════════════════════════════════════════════════════════════════
-- BLOCK 2 — Trigger tự động tính streak mỗi khi 1 exam_attempts được nộp
-- ═══════════════════════════════════════════════════════════════════════
-- exam_attempts luôn được insert với status='in_progress' trước (ExamPage/
-- MockExamPage), rồi RPC submit_exam_attempt/submit_mock_exam_attempt mới
-- UPDATE status sang submitted/auto_submitted kèm điểm — nên trigger gắn
-- trên UPDATE (không phải INSERT).
--
-- Điều kiện "AND NEW.score IS NOT NULL" chặn đúng cái bẫy đã ghi trong
-- docs/DATABASE_SCHEMA.md: khi học sinh bấm "Bắt đầu lại" trên ResumeModal,
-- client tự UPDATE status='auto_submitted' cho attempt CŨ trực tiếp (không
-- qua RPC), score vẫn NULL vì chưa từng có answers để chấm — không được
-- tính là 1 ngày hoạt động thật.
--
-- Áp dụng cho cả bài thi thường lẫn mock exam (không lọc is_mock) — cả 2
-- đều là "luyện tập". FOR UPDATE khoá dòng profile trong lúc tính, tránh
-- race hiếm khi có nhiều request submit gần như đồng thời cho cùng 1 user
-- (cùng convention với record_purchase_payment ở 2026-07-14_security_hardening.sql).
CREATE OR REPLACE FUNCTION update_streak_on_submit()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_today   date := (NEW.submitted_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
  v_last    date;
  v_current int;
  v_longest int;
BEGIN
  SELECT last_streak_date, current_streak, longest_streak
    INTO v_last, v_current, v_longest
    FROM profiles WHERE id = NEW.user_id FOR UPDATE;

  IF v_last = v_today THEN
    RETURN NEW; -- đã tính hôm nay rồi (VD: 2 bài nộp cùng 1 ngày)
  ELSIF v_last = v_today - 1 THEN
    v_current := COALESCE(v_current, 0) + 1;
  ELSE
    v_current := 1;
  END IF;

  UPDATE profiles SET
    current_streak   = v_current,
    longest_streak    = GREATEST(COALESCE(v_longest, 0), v_current),
    last_streak_date = v_today
    WHERE id = NEW.user_id;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_update_streak_on_submit ON exam_attempts;
CREATE TRIGGER trg_update_streak_on_submit
  AFTER UPDATE OF status, submitted_at ON exam_attempts
  FOR EACH ROW
  WHEN (NEW.status IN ('submitted', 'auto_submitted') AND NEW.score IS NOT NULL)
  EXECUTE FUNCTION update_streak_on_submit();

-- Xác nhận Block 2:
-- SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'trg_update_streak_on_submit';


-- ═══════════════════════════════════════════════════════════════════════
-- BLOCK 3 — RPC cho học sinh tự bật/tắt hiển thị trên bảng xếp hạng
-- ═══════════════════════════════════════════════════════════════════════
-- Không dùng client `.update()` trực tiếp trên profiles dù RLS "update
-- own" (auth.uid() = id) cho phép — đi qua RPC để nhất quán với nguyên tắc
-- "ghi có ý nghĩa nghiệp vụ đi qua RPC/Edge Function" đã áp dụng toàn dự án,
-- và để RPC chỉ có thể sửa đúng 1 cột này (không mở rộng bề mặt ghi tuỳ ý
-- lên các cột nhạy cảm khác như role/is_active).
CREATE OR REPLACE FUNCTION set_leaderboard_opt_in(p_opt_in boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  UPDATE profiles SET leaderboard_opt_in = p_opt_in WHERE id = auth.uid();
END; $$;
GRANT EXECUTE ON FUNCTION set_leaderboard_opt_in(boolean) TO authenticated;

-- Xác nhận Block 3:
-- SELECT proname FROM pg_proc WHERE proname = 'set_leaderboard_opt_in';


-- ═══════════════════════════════════════════════════════════════════════
-- BLOCK 4 — RPC lấy bảng xếp hạng (lớp / trường / toàn hệ thống)
-- ═══════════════════════════════════════════════════════════════════════
-- Khác các RPC analytics khác (get_exam_group_breakdown, ...) vốn
-- teacher-only: RPC này KHÔNG teacher-gated vì đây là dữ liệu học sinh tự
-- nguyện công khai cho nhau xem (chỉ trả về học sinh có leaderboard_opt_in
-- = true) — đúng tinh thần "opt-in để tránh áp lực điểm số". Chỉ 2 tiêu
-- chí: streak và số bài đã hoàn thành — cố tình KHÔNG có điểm trung bình.
--
-- p_scope_value: GIỮ tham số này trong chữ ký (client vẫn gửi lên) để
-- không phải đổi kiểu tham số (tránh bẫy CREATE OR REPLACE đổi signature,
-- xem docs/DATABASE_SCHEMA.md → Bẫy thường gặp) nhưng KHÔNG dùng giá trị
-- client gửi để lọc — với p_scope 'class'/'school', lớp/trường luôn lấy
-- trực tiếp từ profile của auth.uid() trong DB. Trước đây tin thẳng
-- p_scope_value từ client: 1 user bất kỳ có thể tự sửa request (devtools/
-- Postman) để xem leaderboard của lớp/trường KHÁC lớp/trường của họ —
-- bảng `schools` lại có RLS đọc công khai cho mọi authenticated user, nên
-- việc dò hết leaderboard mọi trường rất dễ. Chặn tại nguồn thay vì chỉ
-- dựa vào UI (LeaderboardPage chỉ truyền scopeValue = lớp/trường của
-- chính user, nhưng đó chỉ là hành vi UI, không phải kiểm soát quyền).
--
-- current_streak trả về: tính lại "hiệu lực" ngay trong SQL (cùng công
-- thức với src/utils/streak.js's getEffectiveStreak — gãy chuỗi nếu
-- last_streak_date cách hôm nay (giờ VN) hơn 1 ngày) thay vì trả thẳng cột
-- thô trên `profiles`. Cột thô chỉ được cập nhật khi có bài nộp mới (xem
-- trigger BLOCK 2) — 1 học sinh đã nghỉ luyện tập nhiều ngày vẫn giữ
-- nguyên số cũ trên `profiles` cho tới lần nộp bài kế tiếp, nên nếu không
-- tính lại ở đây, bảng xếp hạng sẽ RANK theo số liệu ảo (sai thứ hạng) và
-- hiển thị lệch với chính con số Dashboard của học sinh đó cho thấy.
CREATE OR REPLACE FUNCTION get_leaderboard(
  p_scope       text,
  p_scope_value text DEFAULT NULL,
  p_metric      text DEFAULT 'streak',
  p_limit       int  DEFAULT 50
)
RETURNS TABLE (
  user_id        uuid,
  full_name      text,
  class_name     text,
  school         text,
  current_streak int,
  longest_streak int,
  total_attempts bigint,
  rank           bigint
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_today_vn      date := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
  v_caller_class  text;
  v_caller_school text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF p_scope NOT IN ('class', 'school', 'global') THEN RAISE EXCEPTION 'invalid p_scope'; END IF;
  IF p_metric NOT IN ('streak', 'attempts') THEN RAISE EXCEPTION 'invalid p_metric'; END IF;

  SELECT p.class_name, p.school INTO v_caller_class, v_caller_school
    FROM profiles p WHERE p.id = auth.uid();

  -- Không có lớp/trường thì scope đó rỗng — trả 0 dòng thay vì raise, để
  -- client (đã tự disable chip tương ứng khi profile thiếu class_name/
  -- school) không cần xử lý case lỗi riêng.
  IF p_scope = 'class' AND v_caller_class IS NULL THEN RETURN; END IF;
  IF p_scope = 'school' AND v_caller_school IS NULL THEN RETURN; END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      p.id AS user_id, p.full_name, p.class_name, p.school,
      CASE
        WHEN p.last_streak_date IS NULL OR p.last_streak_date < v_today_vn - 1 THEN 0
        ELSE p.current_streak
      END AS current_streak,
      p.longest_streak,
      COUNT(ea.id) FILTER (
        WHERE ea.status IN ('submitted', 'auto_submitted') AND ea.score IS NOT NULL
      ) AS total_attempts
    FROM profiles p
    LEFT JOIN exam_attempts ea ON ea.user_id = p.id
    WHERE p.role = 'student' AND p.is_active = true AND p.leaderboard_opt_in = true
      AND (
        p_scope = 'global'
        OR (p_scope = 'class' AND p.class_name = v_caller_class)
        OR (p_scope = 'school' AND p.school = v_caller_school)
      )
    GROUP BY p.id
  )
  SELECT
    b.user_id, b.full_name, b.class_name, b.school,
    b.current_streak, b.longest_streak, b.total_attempts,
    RANK() OVER (
      ORDER BY
        CASE WHEN p_metric = 'streak' THEN b.current_streak ELSE b.total_attempts END DESC,
        b.full_name ASC  -- tie-break ổn định, tránh thứ tự đổi ngẫu nhiên giữa các lần fetch khi hoà điểm
    ) AS rank
  FROM base b
  ORDER BY rank, b.full_name ASC
  LIMIT LEAST(GREATEST(p_limit, 1), 200);  -- trần an toàn, p_limit từ client không giới hạn trước đây
END; $$;
GRANT EXECUTE ON FUNCTION get_leaderboard(text, text, text, int) TO authenticated;

-- Xác nhận Block 4:
-- SELECT * FROM get_leaderboard('global', NULL, 'streak', 10);
-- SELECT * FROM get_leaderboard('global', NULL, 'attempts', 10);
-- SELECT * FROM get_leaderboard('class', 'bất-kỳ-lớp-nào-không-phải-của-mình', 'streak', 10);
--   ↑ phải trả về ĐÚNG kết quả của lớp của USER ĐANG GỌI (JWT hiện tại),
--     không phải lớp trong p_scope_value — xác nhận scope value bị bỏ qua
-- SELECT * FROM get_leaderboard('school', 'bất-kỳ-trường-nào-không-phải-của-mình', 'streak', 10);
--   ↑ tương tự, phải trả về trường của user gọi, không phải giá trị truyền vào


-- ═══════════════════════════════════════════════════════════════════════
-- BLOCK 5 — RPC lấy hạng của chính người gọi (kể cả khi ngoài top hiển thị)
-- ═══════════════════════════════════════════════════════════════════════
-- LeaderboardPage chỉ hiển thị top p_limit (mặc định 50) — học sinh ngoài
-- top 50 không thấy tên mình trong danh sách và không biết đang hạng bao
-- nhiêu. RPC riêng, nhẹ hơn (không trả toàn bộ danh sách), chỉ trả hạng +
-- giá trị + tổng số người tham gia scope đó cho đúng user đang gọi. Dùng
-- chung logic effective-streak + scope-từ-profile với get_leaderboard
-- (BLOCK 4) — trùng lặp CTE có chủ đích, giữ 2 RPC độc lập thay vì tách 1
-- view/function dùng chung, đúng quy ước "mỗi RPC tự chứa" của các RPC
-- khác trong file này.
CREATE OR REPLACE FUNCTION get_my_leaderboard_rank(
  p_scope  text,
  p_metric text DEFAULT 'streak'
)
RETURNS TABLE (
  rank                bigint,
  current_streak      int,
  total_attempts      bigint,
  total_participants  bigint
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_today_vn      date := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
  v_caller_class  text;
  v_caller_school text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF p_scope NOT IN ('class', 'school', 'global') THEN RAISE EXCEPTION 'invalid p_scope'; END IF;
  IF p_metric NOT IN ('streak', 'attempts') THEN RAISE EXCEPTION 'invalid p_metric'; END IF;

  SELECT p.class_name, p.school INTO v_caller_class, v_caller_school
    FROM profiles p WHERE p.id = auth.uid();

  IF p_scope = 'class' AND v_caller_class IS NULL THEN RETURN; END IF;
  IF p_scope = 'school' AND v_caller_school IS NULL THEN RETURN; END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      p.id AS user_id, p.full_name,
      CASE
        WHEN p.last_streak_date IS NULL OR p.last_streak_date < v_today_vn - 1 THEN 0
        ELSE p.current_streak
      END AS current_streak,
      COUNT(ea.id) FILTER (
        WHERE ea.status IN ('submitted', 'auto_submitted') AND ea.score IS NOT NULL
      ) AS total_attempts
    FROM profiles p
    LEFT JOIN exam_attempts ea ON ea.user_id = p.id
    WHERE p.role = 'student' AND p.is_active = true AND p.leaderboard_opt_in = true
      AND (
        p_scope = 'global'
        OR (p_scope = 'class' AND p.class_name = v_caller_class)
        OR (p_scope = 'school' AND p.school = v_caller_school)
      )
    GROUP BY p.id
  ),
  ranked AS (
    SELECT
      b.*,
      RANK() OVER (
        ORDER BY
          CASE WHEN p_metric = 'streak' THEN b.current_streak ELSE b.total_attempts END DESC,
          b.full_name ASC  -- cùng tie-break với get_leaderboard (BLOCK 4) — nếu khác, hạng hiện ở
                            -- "your rank bar" có thể lệch với vị trí thật của user trong danh sách top
      ) AS rnk,
      COUNT(*) OVER () AS total_participants
    FROM base b
  )
  SELECT r.rnk, r.current_streak, r.total_attempts, r.total_participants
  FROM ranked r
  WHERE r.user_id = auth.uid();
  -- Không có dòng nào trả về nếu người gọi chưa opt-in / không phải học
  -- sinh / chưa thuộc scope đó — client coi "0 dòng" là "chưa có hạng để hiện".
END; $$;
GRANT EXECUTE ON FUNCTION get_my_leaderboard_rank(text, text) TO authenticated;

-- Xác nhận Block 5:
-- SELECT * FROM get_my_leaderboard_rank('global', 'streak');


-- ═══════════════════════════════════════════════════════════════════════
-- BLOCK 6 — Index cho query lọc leaderboard trên `profiles`
-- ═══════════════════════════════════════════════════════════════════════
-- get_leaderboard/get_my_leaderboard_rank lọc role='student' AND
-- is_active=true AND leaderboard_opt_in=true rồi match class_name/school —
-- partial index (chỉ index các dòng opt_in=true, dự kiến là thiểu số) để
-- Postgres không phải quét toàn bộ `profiles` mỗi lần gọi 2 RPC này.
-- CONCURRENTLY: chạy riêng lẻ, không trong transaction block (xem quy ước
-- ở supabase/sql/2026-07-13_concurrency_indexes.sql).
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_leaderboard
  ON profiles (role, class_name, school)
  WHERE leaderboard_opt_in = true AND is_active = true;

-- Xác nhận Block 6:
-- SELECT indexname, indexdef FROM pg_indexes WHERE indexname = 'idx_profiles_leaderboard';
