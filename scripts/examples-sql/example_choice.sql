-- Ví dụ 1: Câu hỏi Single Choice (Lựa chọn duy nhất)
-- Exam: GS6 Level 1 - Testing 1
-- ID: 034de6ea-9e75-4cd4-ba9f-e7eeda50b2df

DO $q1$
DECLARE 
  qid uuid;
BEGIN
  -- 1. Chèn câu hỏi vào bảng questions
  INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
  VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Phần mềm nào sau đây là một ví dụ về trình duyệt Web?', NULL, 1)
  RETURNING id INTO qid;

  -- 2. Chèn các câu trả lời vào bảng answers liên kết với qid vừa tạo
  INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
    (qid, 'Microsoft Word', false, 1),
    (qid, 'Google Chrome', true, 2),
    (qid, 'Adobe Photoshop', false, 3),
    (qid, 'Windows 10', false, 4);
END $q1$;
