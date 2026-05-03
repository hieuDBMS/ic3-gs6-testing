-- Ví dụ 3: Câu hỏi Multi Select (Chọn nhiều đáp án đúng)

DO $q7$
DECLARE 
  qid uuid;
BEGIN
  INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
  VALUES ('c0f21e31-237e-4cca-810e-bc96ccc60515'::uuid, 'multi', 'Khi nào người dùng nên cân nhắc thay đổi mật khẩu của mình? (Chọn 3)', NULL, 7)
  RETURNING id INTO qid;

  -- Nhiều đáp án có is_correct = true
  INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
    (qid, 'Nghi ngờ máy tính bị nhiễm mã độc', true, 1),
    (qid, 'Nhận thông báo truy cập trái phép', true, 2),
    (qid, 'Muốn xóa tài khoản', false, 3),
    (qid, 'Đã lâu không thay đổi mật khẩu', true, 4),
    (qid, 'Vừa thay đổi ngày hôm qua', false, 5);
END $q7$;
