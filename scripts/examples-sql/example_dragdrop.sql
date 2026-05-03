-- Ví dụ 2: Câu hỏi Drag & Drop (Kéo thả)
-- Loại này sử dụng bảng 'dragdrop_pairs' thay vì 'answers'

DO $q5$
DECLARE 
  qid uuid;
BEGIN
  INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
  VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Kéo thả các thiết bị vào đúng nhóm NHẬP hoặc XUẤT dữ liệu:', NULL, 5)
  RETURNING id INTO qid;

  -- Đối với dragdrop, chúng ta lưu cặp drag_content và drop_content
  INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
    (qid, 'Bàn phím', 'NHẬP (Input)', 1),
    (qid, 'Chuột', 'NHẬP (Input)', 2),
    (qid, 'Màn hình', 'XUẤT (Output)', 3),
    (qid, 'Máy in', 'XUẤT (Output)', 4);
END $q5$;
