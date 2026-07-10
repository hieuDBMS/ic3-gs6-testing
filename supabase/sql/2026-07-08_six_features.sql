-- Feature 3: cột theo dõi tiến độ realtime
ALTER TABLE exam_attempts
  ADD COLUMN IF NOT EXISTS current_question_index int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz NOT NULL DEFAULT now();
-- Policy UPDATE (own) đã có sẵn (auth.uid() = user_id), không cần policy mới.

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE exam_attempts;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Feature 4: bảng log gian lận
CREATE TABLE IF NOT EXISTS exam_cheat_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id  uuid NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id),
  event_type  text NOT NULL CHECK (event_type IN ('tab_switch', 'fullscreen_exit')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE exam_cheat_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exam_cheat_events_insert_own" ON exam_cheat_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "exam_cheat_events_select_own" ON exam_cheat_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "exam_cheat_events_select_teacher" ON exam_cheat_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'teacher')
);
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE exam_cheat_events;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Feature 2 + 6: RPC thống kê câu sai nhiều nhất (SECURITY DEFINER, tự kiểm tra role='teacher')
CREATE OR REPLACE FUNCTION get_question_wrong_stats(
  p_min_attempts int DEFAULT 5, p_level_id uuid DEFAULT NULL,
  p_exam_type text DEFAULT NULL, p_question_type text DEFAULT NULL
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
  WHERE (p_level_id IS NULL OR e.level_id = p_level_id)
    AND (p_exam_type IS NULL OR e.exam_type = p_exam_type)
    AND (p_question_type IS NULL OR q.question_type = p_question_type)
  GROUP BY q.id, q.exam_id, e.title, lv.label, e.exam_type, e.exam_number, q.question_type, q.content
  HAVING COUNT(aa.id) >= p_min_attempts
  ORDER BY wrong_pct DESC NULLS LAST;
END; $$;

-- Feature 6: phân bố điểm (histogram bucket 10 điểm)
CREATE OR REPLACE FUNCTION get_exam_score_distribution(
  p_level_id uuid DEFAULT NULL, p_exam_type text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL, p_date_to timestamptz DEFAULT NULL,
  p_school_id uuid DEFAULT NULL, p_class_name text DEFAULT NULL
)
RETURNS TABLE (bucket_label text, bucket_min int, attempt_count bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher') THEN
    RAISE EXCEPTION 'forbidden: teacher role required';
  END IF;
  RETURN QUERY
  SELECT (b || '-' || (b + 9))::text, b, COUNT(*)::bigint
  FROM exam_attempts ea
  JOIN exams e ON e.id = ea.exam_id
  JOIN profiles p ON p.id = ea.user_id
  CROSS JOIN LATERAL (SELECT LEAST(90, FLOOR(COALESCE(ea.score,0) / 10) * 10)::int AS b) buckets
  WHERE ea.status IN ('submitted', 'auto_submitted')
    AND (p_level_id IS NULL OR e.level_id = p_level_id)
    AND (p_exam_type IS NULL OR e.exam_type = p_exam_type)
    AND (p_date_from IS NULL OR ea.started_at >= p_date_from)
    AND (p_date_to IS NULL OR ea.started_at <= p_date_to)
    AND (p_school_id IS NULL OR p.school = p_school_id)
    AND (p_class_name IS NULL OR p.class_name = p_class_name)
  GROUP BY b ORDER BY b;
END; $$;

-- Feature 6: breakdown theo lớp/trường/level
CREATE OR REPLACE FUNCTION get_exam_group_breakdown(
  p_group_by text, p_level_id uuid DEFAULT NULL, p_exam_type text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL, p_date_to timestamptz DEFAULT NULL
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
  LEFT JOIN schools s ON s.id = p.school
  WHERE ea.status IN ('submitted', 'auto_submitted')
    AND (p_level_id IS NULL OR e.level_id = p_level_id)
    AND (p_exam_type IS NULL OR e.exam_type = p_exam_type)
    AND (p_date_from IS NULL OR ea.started_at >= p_date_from)
    AND (p_date_to IS NULL OR ea.started_at <= p_date_to)
  GROUP BY 1 ORDER BY avg_score ASC NULLS LAST;
END; $$;

GRANT EXECUTE ON FUNCTION get_question_wrong_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_exam_score_distribution TO authenticated;
GRANT EXECUTE ON FUNCTION get_exam_group_breakdown TO authenticated;

-- Follow-up: add p_pass_filter param to score-distribution and group-breakdown RPCs
-- (applied as DROP + CREATE, not CREATE OR REPLACE, because the new param changes the signature)
DROP FUNCTION IF EXISTS get_exam_score_distribution(uuid, text, timestamptz, timestamptz, uuid, text);
DROP FUNCTION IF EXISTS get_exam_group_breakdown(text, uuid, text, timestamptz, timestamptz);

CREATE FUNCTION get_exam_score_distribution(
  p_level_id uuid DEFAULT NULL, p_exam_type text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL, p_date_to timestamptz DEFAULT NULL,
  p_school_id uuid DEFAULT NULL, p_class_name text DEFAULT NULL,
  p_pass_filter text DEFAULT NULL
)
RETURNS TABLE (bucket_label text, bucket_min int, attempt_count bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher') THEN
    RAISE EXCEPTION 'forbidden: teacher role required';
  END IF;
  RETURN QUERY
  SELECT (b || '-' || (b + 9))::text, b, COUNT(*)::bigint
  FROM exam_attempts ea
  JOIN exams e ON e.id = ea.exam_id
  JOIN profiles p ON p.id = ea.user_id
  CROSS JOIN LATERAL (SELECT LEAST(90, FLOOR(COALESCE(ea.score,0) / 10) * 10)::int AS b) buckets
  WHERE ea.status IN ('submitted', 'auto_submitted')
    AND (p_level_id IS NULL OR e.level_id = p_level_id)
    AND (p_exam_type IS NULL OR e.exam_type = p_exam_type)
    AND (p_date_from IS NULL OR ea.started_at >= p_date_from)
    AND (p_date_to IS NULL OR ea.started_at <= p_date_to)
    AND (p_school_id IS NULL OR p.school = p_school_id)
    AND (p_class_name IS NULL OR p.class_name = p_class_name)
    AND (p_pass_filter IS NULL OR p_pass_filter = 'all'
         OR (p_pass_filter = 'pass' AND ea.score >= 70)
         OR (p_pass_filter = 'fail' AND ea.score < 70))
  GROUP BY b ORDER BY b;
END; $$;

CREATE FUNCTION get_exam_group_breakdown(
  p_group_by text, p_level_id uuid DEFAULT NULL, p_exam_type text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL, p_date_to timestamptz DEFAULT NULL,
  p_pass_filter text DEFAULT NULL
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
  LEFT JOIN schools s ON s.id = p.school
  WHERE ea.status IN ('submitted', 'auto_submitted')
    AND (p_level_id IS NULL OR e.level_id = p_level_id)
    AND (p_exam_type IS NULL OR e.exam_type = p_exam_type)
    AND (p_date_from IS NULL OR ea.started_at >= p_date_from)
    AND (p_date_to IS NULL OR ea.started_at <= p_date_to)
    AND (p_pass_filter IS NULL OR p_pass_filter = 'all'
         OR (p_pass_filter = 'pass' AND ea.score >= 70)
         OR (p_pass_filter = 'fail' AND ea.score < 70))
  GROUP BY 1 ORDER BY avg_score ASC NULLS LAST;
END; $$;

GRANT EXECUTE ON FUNCTION get_exam_score_distribution(uuid, text, timestamptz, timestamptz, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_exam_group_breakdown(text, uuid, text, timestamptz, timestamptz, text) TO authenticated;

-- Bugfix (2026-07-08b): profiles.school is actually `text`, not `uuid` as
-- assumed — fix p_school_id param type + the schools JOIN condition.
-- Caused: "operator does not exist: text = uuid" on the Analytics page.
DROP FUNCTION IF EXISTS get_exam_score_distribution(uuid, text, timestamptz, timestamptz, uuid, text, text);
DROP FUNCTION IF EXISTS get_exam_group_breakdown(text, uuid, text, timestamptz, timestamptz, text);

CREATE FUNCTION get_exam_score_distribution(
  p_level_id uuid DEFAULT NULL, p_exam_type text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL, p_date_to timestamptz DEFAULT NULL,
  p_school_id text DEFAULT NULL, p_class_name text DEFAULT NULL,
  p_pass_filter text DEFAULT NULL
)
RETURNS TABLE (bucket_label text, bucket_min int, attempt_count bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher') THEN
    RAISE EXCEPTION 'forbidden: teacher role required';
  END IF;
  RETURN QUERY
  SELECT (b || '-' || (b + 9))::text, b, COUNT(*)::bigint
  FROM exam_attempts ea
  JOIN exams e ON e.id = ea.exam_id
  JOIN profiles p ON p.id = ea.user_id
  CROSS JOIN LATERAL (SELECT LEAST(90, FLOOR(COALESCE(ea.score,0) / 10) * 10)::int AS b) buckets
  WHERE ea.status IN ('submitted', 'auto_submitted')
    AND (p_level_id IS NULL OR e.level_id = p_level_id)
    AND (p_exam_type IS NULL OR e.exam_type = p_exam_type)
    AND (p_date_from IS NULL OR ea.started_at >= p_date_from)
    AND (p_date_to IS NULL OR ea.started_at <= p_date_to)
    AND (p_school_id IS NULL OR p.school = p_school_id)
    AND (p_class_name IS NULL OR p.class_name = p_class_name)
    AND (p_pass_filter IS NULL OR p_pass_filter = 'all'
         OR (p_pass_filter = 'pass' AND ea.score >= 70)
         OR (p_pass_filter = 'fail' AND ea.score < 70))
  GROUP BY b ORDER BY b;
END; $$;

CREATE FUNCTION get_exam_group_breakdown(
  p_group_by text, p_level_id uuid DEFAULT NULL, p_exam_type text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL, p_date_to timestamptz DEFAULT NULL,
  p_pass_filter text DEFAULT NULL
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
  GROUP BY 1 ORDER BY avg_score ASC NULLS LAST;
END; $$;

GRANT EXECUTE ON FUNCTION get_exam_score_distribution(uuid, text, timestamptz, timestamptz, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_exam_group_breakdown(text, uuid, text, timestamptz, timestamptz, text) TO authenticated;
