
-- Câu hỏi 1: Single Choice
DO $q1$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Khi tạo một tờ rơi quảng cáo doanh nghiệp, Natasha đã tìm thấy hình ảnh này trên creativecommons.org. Tại sao cô ấy không được phép sử dụng hình ảnh cho dự án của mình?', NULL, 1)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Hình ảnh yêu cầu Attribution', false, 1),
(qid, 'Hình ảnh liệt kê điều kiện Phi thương mại (NonCommercial)', true, 2),
(qid, 'Hình ảnh không liệt kê điều kiện Creative Commons', false, 3),
(qid, 'Hình ảnh liệt kê điều kiện ShareAlike', false, 4);
END $q1$;


-- Câu hỏi 2: Multi Select
DO $q2$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Tùy chọn nào sau đây là lí do mà một tác giả có thể xuất bản thông tin mang tính thiên vị? (Chọn 2)', NULL, 2)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Họ có thể nhận được các quyền lợi về tiền bạc hoặc địa vị', true, 1),
(qid, 'Họ là những kẻ nói dối', false, 2),
(qid, 'Thông tin phù hợp nhất với niềm tin của họ', true, 3),
(qid, 'Họ thích làm sai lệch sự thật', false, 4);
END $q2$;


-- Câu hỏi 3: Drag & Drop
DO $q3$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Bạn vừa tốt nghiệp chuyên ngành công nghệ thông tin và được nhận làm việc cho Phòng CNTT của một tập đoàn lớn. Làm thế nào bạn có thể cập nhật kiến thức kỹ thuật số của mình? Chọn Đúng hoặc Sai:', NULL, 3)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Tình nguyện ngồi vào ban cố vấn của một tổ chức phi lợi nhuận', 'Sai', 1),
(qid, 'Đọc nguồn cấp tin tức công nghệ hàng tuần liên quan đến lĩnh vực của bạn', 'Đúng', 2),
(qid, 'Nói chuyện với các đồng nghiệp có kinh nghiệm về các công nghệ mới', 'Đúng', 3);
END $q3$;


-- Câu hỏi 4: Multi Select
DO $q4$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Trong các trường hợp sau đây, tùy chọn nào là nguồn thông tin thường KHÔNG có trích dẫn nguồn? (Chọn 2)', NULL, 4)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Bài báo khoa học có thông tin rõ ràng về tác giả và lí lịch của họ', false, 1),
(qid, 'Các bài báo trên Web đã được đánh giá bởi các học giả đáng tin cậy', false, 2),
(qid, 'Các bài đăng trên mạng xã hội không trích dẫn nguồn của chúng', true, 3),
(qid, 'Những trang Web có chú thích nguồn của thông tin', false, 4),
(qid, 'Ý kiến của bạn bè và thành viên gia đình được trình bày dưới dạng cơ sở lập luận', true, 5);
END $q4$;


-- Câu hỏi 5: Single Choice
DO $q5$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Lý do nào sau đây có nhiều khả năng nhất khiến một số miền cấp cao nhất .edu hiển thị các thông tin sai lệch?', NULL, 5)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Trường hướng tới mục tiêu tối đa hóa lợi nhuận cho các cổ đông', true, 1),
(qid, 'Họ thích xuyên tạc về sinh viên của họ', false, 2),
(qid, 'Các nhà giáo dục của họ không đáng tin cậy', false, 3),
(qid, 'Họ muốn thông tin sai lệch cho quần chúng', false, 4);
END $q5$;


-- Câu hỏi 6: Single Choice
DO $q6$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Tùy chọn nào sau đây được sử dụng để bảo vệ một sáng chế không bị sao chép?', NULL, 6)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Cloud storage', false, 1),
(qid, 'Copyright', false, 2),
(qid, 'Trademark', false, 3),
(qid, 'Patent', true, 4);
END $q6$;


-- Câu hỏi 7: Single Choice
DO $q7$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Tùy chọn nào sau đây là một ví dụ về tài sản cá nhân?', NULL, 7)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Một Blog được viết cho một doanh nghiệp', false, 1),
(qid, 'Một video được quay bằng Camera của công ty', false, 2),
(qid, 'Một tài liệu kỹ thuật được viết trên thiết bị của công ty', false, 3),
(qid, 'Hình ảnh từ một chuyến đi đường', true, 4);
END $q7$;


-- Câu hỏi 8: Drag & Drop
DO $q8$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Bạn đã được giao một nhiệm vụ để xác thực quan điểm về kết quả tìm kiếm và tạo tác kỹ thuật số. Chọn Đúng hoặc Sai:', NULL, 8)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Khuynh hướng cánh tả ủng hộ bình đẳng xã hội, chủ nghĩa tự do và các ý tưởng cách mạng', 'Đúng', 1),
(qid, 'Khuynh hướng cánh hữu ủng hộ doanh nghiệp tự do, quyền sở hữu tư nhân và các ý tưởng bảo thủ cho cộng đồng xã hội', 'Đúng', 2),
(qid, 'Những câu chuyện được đăng tải bởi một mạng truyền thông lớn luôn thể hiện cả hai mặt và một góc nhìn bình đẳng', 'Sai', 3),
(qid, 'Tất cả các bài đăng trên Internet đều có góc nhìn trung lập', 'Sai', 4);
END $q8$;


-- Câu hỏi 9: Single Choice
DO $q9$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Tài nguyên nào tốt nhất để một người sử dụng khi viết báo cáo về các hành tinh?', NULL, 9)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Một trang Blog', false, 1),
(qid, 'Một tạp chí khoa học', true, 2),
(qid, 'Một bài đăng trên mạng xã hội', false, 3),
(qid, 'Một tiểu thuyết hư cấu', false, 4);
END $q9$;


-- Câu hỏi 10: Multi Select
DO $q10$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Trích dẫn (Citation) trang Web thường bao gồm những gì? (Chọn 3)', NULL, 10)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'URL', true, 1),
(qid, 'Website name', true, 2),
(qid, 'Publisher', false, 3),
(qid, 'Book title', false, 4),
(qid, 'Publication date', true, 5);
END $q10$;


-- Câu hỏi 11: Single Choice
DO $q11$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Loại bản phát hành nào cho phép người dùng tận dụng hình ảnh của một cá nhân?', NULL, 11)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Model release', true, 1),
(qid, 'Media release', false, 2),
(qid, 'Marketing release', false, 3),
(qid, 'Location release', false, 4);
END $q11$;


-- Câu hỏi 12: Multi Select
DO $q12$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Các chủ doanh nghiệp nên cân nhắc làm gì để bảo vệ tài sản công ty của mình tốt nhất? (Chọn 2)', NULL, 12)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Một biểu mẫu không tiết lộ cho nhân viên và đối tác ký', true, 1),
(qid, 'Một luật sư gian xảo', false, 2),
(qid, 'Đăng ký tên doanh nghiệp, tên miền và sản phẩm của họ', true, 3),
(qid, 'Hiểu biết CPA', false, 4),
(qid, 'Bằng kinh doanh', false, 5);
END $q12$;


-- Câu hỏi 13: Single Choice
DO $q13$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Điều kiện nào của Creative Commons cho phép sao chép, phân phối, hiển thị hoặc trình diễn bản gốc của tác phẩm nhưng không thể thực hiện sửa đổi nếu không có sự cho phép của chủ sở hữu?', NULL, 13)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'NonCommercial', false, 1),
(qid, 'Attribution', false, 2),
(qid, 'ShareAlike', false, 3),
(qid, 'NoDerivatives', true, 4);
END $q13$;


-- Câu hỏi 14: Single Choice
DO $q14$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Để tránh bị đồng sở hữu tài sản trí tuệ, người dùng phải làm gì?', NULL, 14)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Mã hóa dữ liệu để một chủ sở hữu chung mất quyền truy cập', false, 1),
(qid, 'Thuê một chuyên gia CNTT để bảo vệ thông tin tài sản', false, 2),
(qid, 'Xác định chỉ một người là chủ sở hữu và lập giấy tờ hợp pháp với luật sư', true, 3),
(qid, 'Đặt mật khẩu mạnh cho tất cả các máy tính liên quan đến lưu trữ nội dung', false, 4);
END $q14$;


-- Câu hỏi 15: Drag & Drop
DO $q15$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Câu hỏi nối hình - Mô tả chức năng của các khối trong sơ đồ', NULL, 15)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Hình thoi: Khối Quyết định (Decision Box)', 'Một quyết định (Decision) như "Có" so với "Không" hoặc "Đúng" so với "Sai"', 1),
(qid, 'Hình chữ nhật: Khối Quá trình (Process Box)', 'Các quy trình trong một sơ đồ', 2),
(qid, 'Hình bình hành: Khối Nhập/Xuất (Input/Output Box)', 'Được sử dụng để biểu diễn Đầu vào (Input) hoặc Đầu ra (Output)', 3),
(qid, 'Hình Oval: Khối Bắt đầu/Kết thúc (Terminator)', 'Đánh dấu phần đầu và phần cuối của một sơ đồ', 4);
END $q15$;


-- Câu hỏi 16: Single Choice
DO $q16$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Lớp học lịch sử mà bạn đang tham gia một chuyến đi thực tế đến một viện bảo tàng. Một số bạn cùng lớp không thể tham dự. Giáo viên của bạn đã yêu cầu một tình nguyện viên phát trực tuyến trên Web về chuyến đi thực tế. Ứng dụng nào sau đây sẽ thích hợp để tạo Webcast?', NULL, 16)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Microsoft PowerPoint', false, 1),
(qid, 'Adobe InDesign', false, 2),
(qid, 'Zoom', true, 3),
(qid, 'Google Chrome', false, 4);
END $q16$;


-- Câu hỏi 17: Single Choice
DO $q17$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Người dùng có thể tìm thấy các tùy chọn định dạng và in trên trang nào trong hộp thoại Word Options?', NULL, 17)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Display', true, 1),
(qid, 'General', false, 2),
(qid, 'Language', false, 3),
(qid, 'Proofing', false, 4);
END $q17$;


-- Câu hỏi 18: Drag & Drop
DO $q18$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Xác định loại biểu đồ thích hợp với dữ liệu được mô tả. Hoàn thành các câu hỏi bằng cách chọn tùy chọn đúng với mỗi danh sách.', NULL, 18)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Minh họa các mối quan hệ đơn giản từ một phần đến toàn bộ trong một tập dữ liệu nhỏ', 'Pie Chart (Biểu đồ tròn)', 1),
(qid, 'Cho biết một hoặc nhiều chuỗi dữ liệu thay đổi như thế nào theo thời gian', 'Line Chart (Biểu đồ đường)', 2),
(qid, 'Hiển thị khối lượng bán hàng của các sản phẩm khác nhau (so sánh)', 'Column Chart (Biểu đồ cột)', 3);
END $q18$;


-- Câu hỏi 19: Single Choice
DO $q19$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Trên thẻ Home trong Word, nhóm nào cho phép người dùng đặt giãn cách dòng mặc định?', NULL, 19)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Styles', false, 1),
(qid, 'Paragraph', true, 2),
(qid, 'Layout', false, 3),
(qid, 'Font', false, 4);
END $q19$;


-- Câu hỏi 20: Single Choice
DO $q20$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Phần mềm hỗ trợ nào sau đây cho phép người dùng thực hiện các chỉnh sửa và thay đổi nâng cao với hình ảnh?', NULL, 20)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Text-to-speech', false, 1),
(qid, 'Grammarly', false, 2),
(qid, 'Photoshop', true, 3),
(qid, 'Screencast', false, 4);
END $q20$;


-- Câu hỏi 21: Single Choice
DO $q21$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Thuật ngữ Readability là gì?', NULL, 21)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Phông chữ màu đỏ', false, 1),
(qid, 'Văn bản tràn trang', false, 2),
(qid, 'Kích thước phông chữ rất lớn để có thể nhìn rõ', false, 3),
(qid, 'Chất lượng văn bản được rõ ràng hoặc có thể đọc được', true, 4);
END $q21$;


-- Câu hỏi 22: Single Choice
DO $q22$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Phần mềm tiện ích bổ sung nào sau đây có lợi cho người dùng gặp khó khăn với việc đọc hoặc bị suy giảm thị lực?', NULL, 22)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Photoshop', false, 1),
(qid, 'Text-to-speech', true, 2),
(qid, 'PowerPoint', false, 3),
(qid, 'Audacity', false, 4);
END $q22$;


-- Câu hỏi 23: Multi Select
DO $q23$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Bạn là trưởng nhóm thiết kế kỹ thuật số. Nhóm của bạn đang sáng tác một áp phích cho sự kiện gây quỹ tại địa phương. Bạn gửi bản dự thảo của áp phích cho khách hàng. Khách hàng muốn có một số thay đổi mà bạn và các thành viên trong nhóm tin rằng sẽ làm cho áp phích kém hấp dẫn và kém hiệu quả hơn. Bạn cần giao tiếp hiệu quả với khách hàng về những thay đổi trong thiết kế. Bạn nên thực hiện ba hành động nào? (Chọn 3)', NULL, 23)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Hướng cuộc thảo luận tập trung vào các lựa chọn thiết kế, thay vì phản ứng theo cảm xúc...', true, 1),
(qid, 'Tạo mẫu áp phích theo những thay đổi của khách hàng và gửi cho họ', true, 2),
(qid, 'Nói với khách hàng rằng bạn không muốn thực hiện các thay đổi đó', false, 3),
(qid, 'Nhắc nhở khách hàng rằng nhóm của bạn có kiến thức và kinh nghiệm...', false, 4),
(qid, 'Nói chuyện với khách hàng rằng ý tưởng của họ không được hoan nghênh', false, 5),
(qid, 'Yêu cầu khách hàng giải thích lý do thay đổi và tác động của các thay đổi này đối với áp phích', true, 6);
END $q23$;


-- Câu hỏi 24: Multi Select
DO $q24$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Bạn đang chuẩn bị một bài thuyết trình về quá trình tăng dân số ở thành phố của bạn qua nhiều năm. Bạn cần thể hiện sự gia tăng dân số theo thời gian một cách hiệu quả. Tùy chọn nào sau đây là hình thức trình bày trực quan hiệu quả nhất? (Chọn 2)', NULL, 24)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Biểu đồ tròn', false, 1),
(qid, 'Sơ đồ', false, 2),
(qid, 'Biểu đồ thanh', true, 3),
(qid, 'Biểu đồ đường', true, 4);
END $q24$;


-- Câu hỏi 25: Single Choice
DO $q25$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Bạn đang sử dụng một chương trình mới lần đầu tiên. Bạn cần lưu lại công việc của mình. Dựa trên những tiêu chuẩn của phần mềm, bạn nên tìm tính năng Save trên menu nào sau đây?', NULL, 25)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'View', false, 1),
(qid, 'Edit', false, 2),
(qid, 'Help File', false, 3),
(qid, 'File', true, 4),
(qid, 'Share', false, 5);
END $q25$;


-- Câu hỏi 26: Multi Select
DO $q26$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Khi nói đến khả năng tiếp cận cho người dùng khiếm thị, tùy chọn nào sau đây cần được xem xét? (Chọn 3)', NULL, 26)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Màu neon sáng dễ đọc hơn', false, 1),
(qid, 'Nền trắng truyền thống với văn bản đen hoặc nền đen với văn bản trắng thường dễ đọc nhất', true, 2),
(qid, 'Văn bản lớn dễ đọc nhất', true, 3),
(qid, 'Sử dụng phông chữ hoặc biểu đồ có kết cấu rất khó đọc', true, 4),
(qid, 'Màu sắc tương phản cao và thấp có thể khó đọc', false, 5);
END $q26$;


-- Câu hỏi 27: Single Choice
DO $q27$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Bạn cần thuyết trình một loạt hình ảnh và nội dung viết tay trong lớp lịch sử. Bạn nên sử dụng ứng dụng nào sau đây?', NULL, 27)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Google Slides', true, 1),
(qid, 'Quicken', false, 2),
(qid, 'Microsoft Excel', false, 3),
(qid, 'Audacity', false, 4);
END $q27$;


-- Câu hỏi 28: Single Choice
DO $q28$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Tên quy trình của máy tính để chuyển đổi hình ảnh hoặc cảnh quay thành dạng cuối cùng của nó là gì?', NULL, 28)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Initializing', false, 1),
(qid, 'Computing', false, 2),
(qid, 'Rasterizing', false, 3),
(qid, 'Rendering', true, 4);
END $q28$;


-- Câu hỏi 29: Single Choice
DO $q29$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Bạn đang sử dụng ứng dụng Microsoft Word... Tên công ty ABusiness bắt đầu với hai chữ cái in hoa. Mỗi khi bạn gõ, phần mềm sẽ sửa các chữ in hoa. Bạn có thể thay đổi tùy chọn chỉnh sửa này ở đâu?', NULL, 29)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Trong Language Preference của Office', false, 1),
(qid, 'Trong cài đặt Grammar & Refinements', false, 2),
(qid, 'Trong AutoCorrect options', true, 3),
(qid, 'Trong các tuỳ chọn hệ điều hành của máy tính', false, 4);
END $q29$;


-- Câu hỏi 30: Single Choice
DO $q30$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Loại biểu đồ hoặc đồ thị nào được sử dụng để quan sát sự tương quan và phân bố của dữ liệu?', NULL, 30)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Pie chart', false, 1),
(qid, 'Line graph', false, 2),
(qid, 'Table chart', false, 3),
(qid, 'Scatter plot graph', true, 4);
END $q30$;


-- Câu hỏi 31: Drag & Drop
DO $q31$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Bạn cần chọn một dự án để nói lên cách hiểu của mình về một cuốn tiểu thuyết bạn đọc cho lớp tiếng Anh. Nối từng ứng dung với tác vụ thích hợp:', NULL, 31)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Tìm và sửa lỗi bài luận về cuốn tiểu thuyết', 'Grammarly', 1),
(qid, 'Thu âm một bản Podcast đánh giá cuốn tiểu thuyết', 'Audacity', 2),
(qid, 'Thiết kế một tấm áp phích cho cuốn tiểu thuyết', 'Adobe Photoshop', 3),
(qid, 'Gặp bạn cùng lớp trên mạng để thảo luận về cuốn tiểu thuyết', 'Microsoft Teams', 4);
END $q31$;


-- Câu hỏi 32: Single Choice
DO $q32$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Kích thước phông chữ nào được sử dụng phổ biến nhất cho các tiêu đề?', NULL, 32)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, '10-14 pts', false, 1),
(qid, '8-12 pts', false, 2),
(qid, '30-50 pts', false, 3),
(qid, '18-28 pts', true, 4);
END $q32$;


-- Câu hỏi 33: Drag & Drop
DO $q33$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Bạn đang tạo lưu đồ. Hãy nối từng mô tả kí hiệu với kí hiệu tương ứng:', NULL, 33)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Điểm cuối: Thể hiện điểm bắt đầu hoặc kết thúc quy trình', 'Hình Oval (Bắt đầu/Kết thúc)', 1),
(qid, 'Độ trễ: Thể hiện độ trễ trong quy trình', 'Hình chữ D (Độ trễ)', 2),
(qid, 'Quyết định: Thể hiện điểm quyết định giữa hai hoặc nhiều đường trong bảng', 'Hình thoi (Quyết định)', 3),
(qid, 'Dữ liệu: Có thể trình bày bất kì loại dữ liệu nào trong một lưu đồ', 'Hình bình hành (Nhập/Xuất)', 4);
END $q33$;


-- Câu hỏi 34: Single Choice
DO $q34$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Phiên bản phần mềm nào cho phép người dùng truy cập một ứng dụng qua Internet?', NULL, 34)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Diagnostic', false, 1),
(qid, 'Local', false, 2),
(qid, 'Wi-Fi', false, 3),
(qid, 'Online', true, 4);
END $q34$;


-- Câu hỏi 35: Multi Select
DO $q35$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Bạn được giao nhiệm vụ thiết kê một trang Web nhằm đạt được các mục tiêu sau đây: Giúp sinh viên dễ dàng điền thời gian xin nghỉ học; Cho phép sinh viên nêu lí do vắng mặt; Hỗ trợ truy cập trang Web cho sinh viên có kết nối Internet chậm. Bạn cần phải hoàn thành trang web này trong hai tuần nữa. Hai tiêu chí trang Web nào ràng buộc về thiết kế? (Chọn 2)', NULL, 35)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Bạn cần phải hoàn thành trang Web này trong hai tuần nữa (Ràng buộc thời gian)', false, 1),
(qid, 'Trang Web cần hoạt động tốt với kết nối Internet chậm', true, 2),
(qid, 'Trang Web cần đưa ra phương pháp để sinh viên chỉ ra lí do vắng mặt', true, 3),
(qid, 'Trang Web phải dễ sử dụng', false, 4);
END $q35$;


-- Câu hỏi 36: Drag & Drop
DO $q36$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Bạn đang thêm văn bản thay thế (Alt Text) vào hình ảnh trên trang Web của mình. Với mỗi loại thông tin sau đây, hãy chọn Có nếu thấy cần thêm thông tin đó vào văn bản, ngược lại chọn Không:', NULL, 36)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Bản quyền hình ảnh', 'Không', 1),
(qid, 'Mô tả ngắn về hình ảnh', 'Có', 2),
(qid, 'Bối cảnh và chi tiết liên quan đến mục đích của hình ảnh', 'Có', 3);
END $q36$;


-- Câu hỏi 37: Multi Select
DO $q37$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Nếu một người dùng có nhiều dữ liệu để hiển thị thì ứng dụng nào là phù hợp nhất để họ sử dụng? (Chọn 2)', NULL, 37)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'PowerPoint', false, 1),
(qid, 'Teams', false, 2),
(qid, 'Access', true, 3),
(qid, 'Excel', true, 4),
(qid, 'Google Docs', false, 5);
END $q37$;


-- Câu hỏi 38: Multi Select
DO $q38$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Tùy chọn nào sau đây được biết đến với việc sử dụng phông chữ Serif? (Chọn 2)', NULL, 38)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Đề mục và tiêu đề (Heading and Title)', false, 1),
(qid, 'Báo (Newspaper)', true, 2),
(qid, 'Phương tiện truyền thông xã hội (Social Media)', false, 3),
(qid, 'Sách (Book)', true, 4);
END $q38$;


-- Câu hỏi 39: Multi Select
DO $q39$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Bạn thiết kế một trang Web cho trường học để theo dõi sự tham gia của sinh viên vào các câu lạc bộ. Bạn tổ chức một buổi kiểm thử khả năng sử dụng để tìm hiểu xem sinh viên sử dụng trang Web thành thạo đến đâu. Bạn nên thực hiện hai hành động nào để đảm bảo nhận được dữ liệu kiểm thử chất lượng? (Chọn 2)', NULL, 39)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Cho sinh viên biết lý do nhà trường yêu cầu bạn tạo trang Web', false, 1),
(qid, 'Lắng nghe sinh viên và ghi lại bất kỳ câu hỏi nào về cách sử dụng trang Web', true, 2),
(qid, 'Theo dõi các sinh viên sử dụng trang Web và lưu ý xem họ gặp vấn đề gì không', true, 3),
(qid, 'Hướng dẫn sinh viên cách sử dụng trang Web', false, 4);
END $q39$;


-- Câu hỏi 40: Single Choice
DO $q40$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Đối tượng nào sau đây chủ yếu sử dụng văn bản thay thế (Alternative Text)?', NULL, 40)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Những người có trở ngại về lời nói', false, 1),
(qid, 'Người khiếm thính', false, 2),
(qid, 'Những người không biết đọc', false, 3),
(qid, 'Người khiếm thị', true, 4);
END $q40$;
