-- Câu hỏi 1: Multi Select (Chọn nhiều đáp án đúng)
DO $q1$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'multi', 'Tại sao người dùng biết hệ điều hành và phiên bản của hệ điều hành rất quan trọng? (chọn 2)', NULL, 1)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Các tác vụ khác nhau giữa các hệ điều hành', true, 1),
(qid, 'Các bản cập nhật phiên bản khả dụng', true, 2),
(qid, 'Phần mềm có giá đắt', false, 3),
(qid, 'Nhiều ứng dụng miễn phí', false, 4);
END $q1$;


-- Câu hỏi 2: Drag & Drop (Kéo thả/Sắp xếp)
DO $q2$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'dragdrop', 'Hãy sắp xếp các bước sử dụng Start Menu để gỡ cài đặt Outlook trên PC:', NULL, 2)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Chọn biểu tượng Start Menu', 'Bước 1', 1),
(qid, 'Chọn và giữ (hoặc nhấp chuột phải) Outlook', 'Bước 2', 2),
(qid, 'Chọn gỡ cài đặt (Uninstall)', 'Bước 3', 3);
END $q2$;


-- Câu hỏi 3: Single Choice
DO $q3$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'choice', 'Hãy chọn từ thích hợp để hoàn thành phát biểu sau đây: "Số kiểu máy tính (computer model number) là một số được cá nhân hóa do nhà sản xuất . . . . của nó cấp cho một máy tính”.', NULL, 3)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Software', false, 1),
(qid, 'Model', false, 2),
(qid, 'OS', false, 3),
(qid, 'Hardware', true, 4);
END $q3$;


-- Câu hỏi 4: Single Choice
DO $q4$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'choice', 'Bạn cần tìm các trình điều khiển (driver) cho máy tính xách tay chạy Windows 10. Trình quản lý thiết bị hiển thị "thiết bị không xác định" đối với một vài thành phần thiết bị. Bạn nên làm gì?', NULL, 4)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Khởi động lại máy tính và sử dụng công cụ sửa chữa cho Windows 10', false, 1),
(qid, 'Từ trình quản lý thiết bị, tìm nhanh các thay đổi phần cứng', false, 2),
(qid, 'Sử dụng số dòng máy (model number) của máy để tìm driver trên trang web của nhà sản xuất máy tính xách tay', true, 3),
(qid, 'Mua phần mềm cài đặt driver từ cửa hàng đã bán máy tính', false, 4);
END $q4$;


-- Câu hỏi 5: Single Choice
DO $q5$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'choice', 'Để một ứng dụng hoạt động, phần cứng và phần mềm của máy tính phải có chung điểm gì?', NULL, 5)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Chương trình đặc biệt (special program)', false, 1),
(qid, 'Ngôn ngữ nhị phân (binary language)', true, 2),
(qid, 'Mã bổ sung (supplemental code)', false, 3),
(qid, 'Mạng (network)', false, 4);
END $q5$;


-- Câu hỏi 6: Drag & Drop
DO $q6$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'dragdrop', 'Hãy sắp xếp các bước sử dụng Menu Apple để kiểm tra các bản cập nhật trên máy Mac:', NULL, 6)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Chọn biểu tượng Menu Apple', 'Bước 1', 1),
(qid, 'Chọn System Preferences', 'Bước 2', 2),
(qid, 'Chọn Software Update', 'Bước 3', 3);
END $q6$;


-- Câu hỏi 7: Drag & Drop
DO $q7$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'dragdrop', 'Bạn đăng một Video lên trang Web của công ty. Người dùng than phiền rằng Video tải quá lâu. Bạn cần giảm thời gian tải Video. Đối với mỗi hành động, hãy chọn Có nếu hành động đó giúp tải Video nhanh hơn. Ngược lại, hãy chọn Không.', NULL, 7)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Tăng tốc độ bit của Video', 'Không', 1),
(qid, 'Chuyển đổi Video thành HTML5', 'Có', 2),
(qid, 'Giảm độ phân giải của Video', 'Có', 3),
(qid, 'Thay thế Video bằng phiên bản chưa nén', 'Không', 4);
END $q7$;


-- Câu hỏi 8: Single Choice
DO $q8$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'choice', 'Bạn hãy cho biết, tác dụng của việc tăng độ phân giải hình ảnh trước khi chụp ảnh?', NULL, 8)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Hình ảnh bị vỡ nét', false, 1),
(qid, 'Chất lượng hình ảnh được cải thiện', true, 2),
(qid, 'Kích thước hình ảnh nhỏ hơn', false, 3),
(qid, 'Kích thước tập tin giảm xuống', false, 4);
END $q8$;


-- Câu hỏi 9: Multi Select
DO $q9$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'multi', 'Người dùng nhấn nút nguồn nhưng máy tính không khởi động. Người dùng có thể thực hiện hành động nào sau đây để khắc phục sự cố? (chọn 3)', NULL, 9)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Xem cầu dao có bị nổ không', true, 1),
(qid, 'Chuyển sang một máy tính mới', false, 2),
(qid, 'Đảm bảo ổ cắm đang hoạt động', true, 3),
(qid, 'Chờ 24 giờ trước khi thử bật lại máy tính', false, 4),
(qid, 'Đảm bảo đã cắm dây nguồn', true, 5);
END $q9$;


-- Câu hỏi 10: Single Choice
DO $q10$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'choice', 'Phần mềm giao tiếp và cung cấp _______ cho phần cứng.', NULL, 10)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Đề nghị (suggestions)', false, 1),
(qid, 'Chỉ dẫn (instructions)', true, 2),
(qid, 'Hỗ trợ (assistance)', false, 3),
(qid, 'Phần mềm độc hại (malware)', false, 4);
END $q10$;


-- Câu hỏi 11: Single Choice
DO $q11$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'choice', 'Chương trình nào sau đây có thể được sử dụng để đóng một ứng dụng đang bị đóng băng?', NULL, 11)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Windows Update', false, 1),
(qid, 'Settings', false, 2),
(qid, 'Finder', false, 3),
(qid, 'Task Manager', true, 4);
END $q11$;


-- Câu hỏi 12: Drag & Drop
DO $q12$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'dragdrop', 'Xác định xem các thiết bị kỹ thuật số có đáp ứng các yêu cầu hay không. Chọn Đúng nếu thiết bị đáp ứng các yêu cầu hoặc chọn Sai nếu không đáp ứng.', NULL, 12)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Điện thoại thông minh có khả năng kiểm tra Email, gửi tin nhắn và nhận cuộc gọi thoại mà không cần Wi-Fi', 'Đúng', 1),
(qid, 'Một máy tính bảng là đủ để gộp và chỉnh sửa các video lớn trên trang Web của khách hàng', 'Sai', 2),
(qid, 'Máy tính xách tay có thể di động để sử dụng trong lớp học, hỗ trợ truy cập vào đám mây và chạy hầu hết các ứng dụng văn phòng', 'Đúng', 3);
END $q12$;


-- Câu hỏi 13: Single Choice
DO $q13$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'choice', '. . . . .  liên quan đến máy móc được lập trình để suy nghĩ và thực hiện các hành động như con người.', NULL, 13)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Hệ thống SCADA', false, 1),
(qid, 'RNGS', false, 2),
(qid, 'iRobot', false, 3),
(qid, 'Trí tuệ nhân tạo (artificial intelligence)', true, 4);
END $q13$;


-- Câu hỏi 14: Single Choice
DO $q14$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'choice', 'Tùy chọn nào sau đây là hành động giúp xóa dữ liệu cá nhân khỏi thiết bị?', NULL, 14)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Cập nhật phần mềm', false, 1),
(qid, 'Quét nhanh', false, 2),
(qid, 'Tắt thiết bị', false, 3),
(qid, 'Khôi phục cài đặt gốc', true, 4);
END $q14$;


-- Câu hỏi 15: Single Choice
DO $q15$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'choice', 'Loại phần mềm nào sau đây không được cấp phép, không được bảo vệ bản quyền?', NULL, 15)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Cho phép (permissive)', false, 1),
(qid, 'Phần mềm miễn phí (freeware)', false, 2),
(qid, 'Miền công cộng (public domain)', true, 3),
(qid, 'Copyleft', false, 4);
END $q15$;


-- Câu hỏi 16: Single Choice
DO $q16$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'choice', 'Tùy chọn nào sau đây được chỉ định cho mỗi phiên bản (version) phần mềm?', NULL, 16)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Cài đặt không thể thay đổi', false, 1),
(qid, 'Mã hóa khác biệt', false, 2),
(qid, 'Tên phiên bản duy nhất', true, 3),
(qid, 'Hướng dẫn chuyên đề', false, 4);
END $q16$;


-- Câu hỏi 17: Multi Select
DO $q17$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'multi', 'Trung tâm dữ liệu điện toán đám mây tác động tiêu cực đến môi trường theo cách nào sau đây? (Chọn 2)', NULL, 17)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Các trung tâm này sử dụng chất làm mát hóa học, thường được làm từ các vật liệu nguy hiểm', true, 1),
(qid, 'Các trung tâm này được xây dựng ở vùng khí hậu lạnh, gây tổn hại đến môi trường sống của gấu Bắc Cực và các động vật hoang dã khác', false, 2),
(qid, 'Các trung tâm này sử dụng một lượng điện đáng kể được lấy từ các nguồn năng lượng không thể tái tạo', true, 3),
(qid, 'Các trung tâm này đổ nhiệt thải vào các nguồn nước gần đó, làm tăng nhiệt, vượt quá mức mà các sinh vật thủy sinh có thể tồn tại', false, 4);
END $q17$;


-- Câu hỏi 18: Single Choice
DO $q18$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'choice', 'Loại phần mềm nào không cho phép chia sẻ hoặc sửa đổi mã nguồn?', NULL, 18)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Shareware', false, 1),
(qid, 'Closed Source', true, 2),
(qid, 'Freeware', false, 3),
(qid, 'Public Domain', false, 4);
END $q18$;


-- Câu hỏi 19: Drag & Drop
DO $q19$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'dragdrop', 'Với từng phát biểu về công nghệ tự động hoá, hãy chọn Đúng hoặc Sai.', NULL, 19)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Tự động hóa sẽ thay thế một số vai trò công việc hiện có', 'Đúng', 1),
(qid, 'Tự động hóa sẽ tạo ra các vai trò công việc mới', 'Đúng', 2),
(qid, 'Các hoạt động cần tương tác xã hội có nhiều khả năng sẽ được tự động hóa nhiều hơn những hoạt động khác', 'Sai', 3),
(qid, 'Các hoạt động cần thao tác vật lý trong môi trường được dự đoán có nhiều khả năng sẽ được tự động hóa nhiều hơn những hoạt động khác', 'Sai', 4);
END $q19$;


-- Câu hỏi 20: Multi Select
DO $q20$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'multi', 'Những phím tắt nào được sử dụng phổ biến trên các ứng dụng phần mềm? (Chọn 2)', NULL, 20)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Ctrl+C', true, 1),
(qid, 'Shift+P', false, 2),
(qid, 'Shift+S', false, 3),
(qid, 'Ctrl+D', false, 4),
(qid, 'Ctrl+P', true, 5);
END $q20$;


-- Câu hỏi 21: Single Choice
DO $q21$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'choice', 'Ngày nay, các thiết bị có thể trở nên lỗi thời rất nhanh. Người dùng nên làm gì với thiết bị mà họ muốn loại bỏ?', NULL, 21)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Sử dụng cho một dự án nghệ thuật', false, 1),
(qid, 'Tái chế', true, 2),
(qid, 'Lưu trữ cho các thế hệ tương lai', false, 3),
(qid, 'Ném di', false, 4);
END $q21$;


-- Câu hỏi 22: Single Choice
DO $q22$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'choice', 'Định dạng tập tin Video phổ biến nhất được sử dụng để đăng lên mạng xã hội là gì?', NULL, 22)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'MP4', true, 1),
(qid, 'SAV', false, 2),
(qid, 'PRO', false, 3),
(qid, 'JPEG', false, 4);
END $q22$;


-- Câu hỏi 23: Multi Select
DO $q23$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'multi', 'Tùy chọn nào sau đây là đúng với tập tin có độ phân giải cao so với tập tin có độ phân giải thấp? (chọn 3)', NULL, 23)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Thời gian tải xuống lâu hơn', false, 1),
(qid, 'Độ sắc nét và rõ ràng hơn', true, 2),
(qid, 'Thời gian tải xuống ngắn hơn', true, 3),
(qid, 'Số lượng pixel bị giảm', false, 4),
(qid, 'Kích thước tập tin lớn hơn', true, 5);
END $q23$;


-- Câu hỏi 24: Single Choice
DO $q24$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'choice', 'Bạn có thể sử dụng tổ hợp phím nào sau đây để lưu tài liệu?', NULL, 24)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Ctrl+C', false, 1),
(qid, 'Ctrl+S', true, 2),
(qid, 'Ctrl+D', false, 3),
(qid, 'Ctrl+P', false, 4);
END $q24$;


-- Câu hỏi 25: Multi Select
DO $q25$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'multi', 'Loại tập tin WAV thường được sử dụng cho những loại phương tiện nào? (chọn 3)', NULL, 25)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'TV', true, 1),
(qid, 'CDs', true, 2),
(qid, 'Social media posts', false, 3),
(qid, 'DVDs', true, 4),
(qid, 'Web pages', false, 5),
(qid, 'Web videos', false, 6);
END $q25$;


-- Câu hỏi 26: Single Choice
DO $q26$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'choice', 'Phát biểu sau đây là Đúng hay Sai: "Một lợi ích của lập phiên bản đám mây là người dùng có thể lưu trữ nhiều phiên bản của một tập tin”.', NULL, 26)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Đúng', true, 1),
(qid, 'Sai', false, 2);
END $q26$;


-- Câu hỏi 27: Single Choice
DO $q27$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'choice', 'Bạn hãy cho biết, phát biểu sau đây là Đúng hay Sai: "Các thiết bị cũ có thể phát nội dung HD tốt tương tự như các thiết bị mới hơn, vì vậy bạn nên luôn xuất ra định dạng 1080p là một ý tưởng tốt”.', NULL, 27)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Đúng', false, 1),
(qid, 'Sai', true, 2);
END $q27$;


-- Câu hỏi 28: Single Choice
DO $q28$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'choice', 'Hãy cho biết, phát biểu sau đây là Đúng hay Sai: "Người dùng có thể làm bất cứ điều gì mà họ muốn sau khi họ đã cài đặt phần mềm của mình. Họ không bắt buộc phải đọc giấy phép phần mềm”.', NULL, 28)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Đúng', false, 1),
(qid, 'Sai', true, 2);
END $q28$;


-- Câu hỏi 29: Single Choice
DO $q29$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'choice', 'Bạn cần tìm ra phiên bản Windows mà máy tính của bạn đang chạy. Bạn nên thực hiện hành động này ở khu vực nào của cửa sổ Cài đặt (setting)?', NULL, 29)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Hệ thống', true, 1),
(qid, 'Thiết bị', false, 2),
(qid, 'Cá nhân hoá', false, 3),
(qid, 'Ứng dụng', false, 4);
END $q29$;


-- Câu hỏi 30: Multi Select
DO $q30$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'multi', 'Các chuyên gia lo ngại rằng xã hội sẽ mất đi một số kỹ năng do sự phụ thuộc vào công nghệ. Tùy chọn nào sau đây là kỹ năng có thể ít được vận dụng do sử dụng công nghệ? (chọn 3)', NULL, 30)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Tính nhẩm', true, 1),
(qid, 'Tổ chức', false, 2),
(qid, 'Sự khéo léo', false, 3),
(qid, 'Phối hợp tay và mắt', false, 4),
(qid, 'Điều hướng bản đồ', true, 5),
(qid, 'Học thuộc lòng', true, 6);
END $q30$;


-- Câu hỏi 31: Single Choice
DO $q31$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'choice', 'Bạn lên kế hoạch bán máy tính của mình. Bạn xoá các tập tin cá nhân trên ổ cứng và sau đó, bạn dọn sạch thùng rác của máy tính (Recycle Bin hoặc Trash). Trên ổ cứng của bạn còn lại dữ liệu nào?', NULL, 31)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Tham chiếu đến các tập tin trên ổ cứng sẽ bị xóa. Dữ liệu tập tin vẫn còn', true, 1),
(qid, 'Không còn gì. Tham chiếu đến các tập tin trên ổ cứng và dữ liệu tập tin bị xóa hoàn toàn', false, 2),
(qid, 'Tất cả. Tham chiếu đến các tập tin trên ổ cứng vẫn còn. Dữ liệu tập tin vẫn còn', false, 3),
(qid, 'Tham chiếu đến các tập tin trên ổ cứng vẫn còn. Dữ liệu tập tin bị xóa hoàn toàn', false, 4);
END $q31$;


-- Câu hỏi 32: Multi Select
DO $q32$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'multi', 'Tùy chọn nào sau đây là ví dụ về AI? (Chọn 2)', NULL, 32)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Dự đoán các giao dịch ngân hàng gian lận', true, 1),
(qid, 'Ghi âm nhạc', false, 2),
(qid, 'Chuyển đổi âm thanh thành văn bản', true, 3),
(qid, 'Sử dụng GPS', false, 4);
END $q32$;


-- Câu hỏi 33: Single Choice
DO $q33$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'choice', 'Bạn lưu và chỉnh sửa tập tin trên Google Drive. Tính năng lập phiên bản trên nền tảng điện toán đám mây đã được bật. Bạn xoá phiên bản trực tiếp của tập tin mà không chỉ định số khởi tạo. Tùy chọn nào sau đây là đúng khi nói về kết quả sẽ xảy ra?', NULL, 33)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Phiên bản trực tiếp (live version) bị xoá vĩnh viễn', false, 1),
(qid, 'Phiên bản trực tiếp (live version) trở thành phiên bản không hiện hành (noncurrent version) và số khởi tạo (generation number) sẽ được giữ nguyên', true, 2),
(qid, 'Một bản sao của phiên bản không hiện hành (noncurrent version) thay thế phiên bản trực tiếp và nhận số khởi tạo (generation number) mới', false, 3),
(qid, 'Phiên bản không hiện hành (noncurrent version) bị xoá vĩnh viễn', false, 4);
END $q33$;


-- Câu hỏi 34: Single Choice
DO $q34$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'choice', 'Điều gì sẽ xảy ra khi bạn phóng to một hình ảnh Bitmap nhỏ được tải xuống từ trang Web?', NULL, 34)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Kích thước tập tin ảnh giảm xuống', false, 1),
(qid, 'Độ phân giải ảnh giảm xuống', false, 2),
(qid, 'Hình ảnh bị vỡ nét', true, 3),
(qid, 'Hình ảnh rõ nét hơn', false, 4);
END $q34$;


-- Câu hỏi 35: Single Choice
DO $q35$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'choice', 'Máy tính của bạn sử dụng hệ điều hành Windows 10. Trên máy tính đã cài đặt sẵn các trình duyệt Web như Microsoft Edge, Microsoft Internet Explorer và Google Chrome. Mỗi khi bạn nhấp chuột vào một liên kết trang Web trong Email của mình, trang Web của liên kết đó được mở ra trên trình duyệt Web Microsoft Edge. Tuy nhiên, bạn lại muốn mỗi khi nhấp chuột vào các liên kết trong Email thì các trang Web sẽ được mở trên trình duyệt Web Google Chrome. Tùy chọn nào sau đây là thích hợp để bạn có thể tùy chỉnh trên máy tính của mình?', NULL, 35)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Các thông báo (notifications)', false, 1),
(qid, 'Trình quản lý tác vụ (task Manager)', false, 2),
(qid, 'Các cài đặt quyền riêng tư cho Email (email privacy settings)', false, 3),
(qid, 'Các ứng dụng mặc định (default apps)', true, 4);
END $q35$;


-- Câu hỏi 36: Multi Select
DO $q36$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'multi', 'Loại dữ liệu nào sau đây sẽ bị xóa khi thiết bị di động Android được khôi phục cài đặt gốc? (chọn 3)', NULL, 36)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Trình bảo vệ màn hình được tải sẵn', false, 1),
(qid, 'Ứng dụng nhắn tin văn bản', false, 2),
(qid, 'Các hình ảnh', true, 3),
(qid, 'Thông tin tài khoản Google của người dùng', true, 4),
(qid, 'Các ứng dụng đã tải xuống', true, 5);
END $q36$;


-- Câu hỏi 37: Single Choice
DO $q37$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'choice', 'Kích thước tập tin nào sau đây là lớn nhất?', NULL, 37)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, '2 terabyte (TB)', false, 1),
(qid, '16 gigabyte (GB)', false, 2),
(qid, '1,44 megabyte (MB)', false, 3),
(qid, '3 petabyte (PB)', true, 4),
(qid, '640 kilobyte (KB)', false, 5);
END $q37$;


-- Câu hỏi 38: Drag & Drop
DO $q38$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'dragdrop', 'Bạn cần khắc phục một số vấn đề gặp phải trên máy tính và điện thoại thông minh của mình. Hãy nối cách khắc phục sự cố trong danh sách ở cột bên phải tương ứng với vấn đề mà bạn gặp phải ở cột bên trái.', NULL, 38)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Màn trập máy ảnh trên điện thoại thông minh của bạn phát ra âm thanh, nhưng hiện tại bạn đang không chụp ảnh', 'Kiểm tra các quyền ứng dụng', 1),
(qid, 'Màn hình máy tính bị đóng băng khi bạn đang làm việc với tập tin dự án', 'Kiểm tra mức độ sử dụng tài nguyên trên trình quản lý tác vụ (Task manager)', 2),
(qid, 'Các trang Web hiển thị nội dung chậm khi bạn đang tìm kiếm thông tin trên internet', 'Kiểm tra kết nối mạng', 3),
(qid, 'Khi bạn khởi động máy tính, bạn nghe thấy tiếng tích tắc nhịp nhàng bên trong thùng máy', 'Kiểm tra hiện tượng mòn đầu đọc/ghi trên ổ đĩa cứng', 4);
END $q38$;


-- Câu hỏi 39: Single Choice
DO $q39$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('f09edc18-621e-4ffc-8d04-ac666ae57795'::uuid, 'choice', 'Hình ảnh và văn bản trên màn hình máy tính xách tay của bạn xuất hiện méo mó. Bạn cần giải quyết vấn đề này. Việc đầu tiên bạn nên làm là gì?', NULL, 39)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Tải xuống tài liệu hướng dẫn sử dụng của máy tính', false, 1),
(qid, 'Kiểm tra cài đặt hiển thị', true, 2),
(qid, 'Gắn thêm một màn hình ngoài', false, 3),
(qid, 'Gọi hỗ trợ kỹ thuật', false, 4);
END $q39$;
