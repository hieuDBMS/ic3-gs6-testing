-- Câu hỏi 1: Single Choice
DO $q1$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Bạn mua một chương trình phần mềm để phục vụ cho việc thực hiện dự án của mình. Sau khi bạn đã hoàn thành dự án, một người bạn hỏi mượn chương trình phần mềm này. Bạn không biết việc cho mượn chương trình phần mềm như vậy có được phép hay không. Tùy chọn nào sau đây là nơi thích hợp để bạn tìm kiếm thông tin?', NULL, 1)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Danh sách kiểm soát truy nhập (ACL)', false, 1),
(qid, 'Hệ thống quản lí nội dung (CMS)', false, 2),
(qid, 'Bảng đánh giá phần mềm điện tử (ESRB)', false, 3),
(qid, 'Thỏa thuận giấy phép người dùng cuối (EULA)', true, 4);
END $q1$;


-- Câu hỏi 2: Single Choice
DO $q2$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Trước khi đặt lại máy Mac, trước tiên người dùng phải đăng xuất tất cả các ứng dụng đã sử dụng hoặc được cấp phép trên máy tính. Tùy chọn nào sau đây, người dùng có thể chọn để bắt đầu quá trình này?', NULL, 2)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Finder', false, 1),
(qid, 'Settings', false, 2),
(qid, 'System Preferences', true, 3),
(qid, 'Disk Utility', false, 4);
END $q2$;


-- Câu hỏi 3: Single Choice
DO $q3$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Bạn tuỳ chỉnh phần cài đặt Google Chrome của mình. Bạn không hài lòng với một số thay đổi. Bạn cần trả Google Chrome về trạng thái mặc định bằng cách chỉ sử dụng một lệnh trên menu Settings như hiển thị trong hình. Bạn nên chọn lệnh nào?', NULL, 3)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Appearance (hình thức hiển thị)', false, 1),
(qid, 'Default browser (trình duyệt mặc định)', false, 2),
(qid, 'You and Google (bạn và Google)', false, 3),
(qid, 'Reset and clean up (đặt lại và dọn dẹp)', true, 4),
(qid, 'On startup (khi khởi động)', false, 5);
END $q3$;


-- Câu hỏi 4: Single Choice
DO $q4$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Mục đích của đạo luật về trách nhiệm giải trình và cung cấp thông tin bảo hiểm y tế (HIPAA - Health Insurance Portability and Accountability Act) là gì?', NULL, 4)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Để bảo vệ hợp pháp thông tin y tế của cá nhân bằng cách hạn chế quyền truy cập đến thông tin y tế của chính họ hoặc người giám hộ đáng tin cậy.', true, 1),
(qid, 'Để giúp các cá nhân hiểu rõ hơn về thông tin y tế của họ.', false, 2),
(qid, 'Để đảm bảo rằng thông tin y tế được chia sẻ với tất cả các thành viên trong gia đình có yêu cầu.', false, 3),
(qid, 'Để ràng buộc các chuyên gia y tế một cách hợp pháp với một cuộc sống bí mật và hoài nghi.', false, 4);
END $q4$;


-- Câu hỏi 5: Drag & Drop
DO $q5$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Hoàn thành các câu sau đây bằng cách lựa chọn đúng tùy chọn từ mỗi danh sách thả xuống.', NULL, 5)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Dấu vân tay và nhận dạng khuôn mặt là những ví dụ về yếu tố xác thực', 'Sinh trắc học', 1),
(qid, 'Điện thoại thông minh và thẻ ra vào của nhân viên là những ví dụ về yếu tố xác thực', 'Vật lý', 2),
(qid, 'Mật khẩu và số nhận dạng cá nhân (PIN) là những ví dụ về yếu tố xác', 'Logic', 3);
END $q5$;


-- Câu hỏi 6: Multi Select
DO $q6$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Bạn đang thực hiện một nghiên cứu trên nền tảng trực tuyến. Bạn thấy một loạt các video có vẻ hỗ trợ giả thuyết của mình. Bạn cần xác định xem liệu video có bị chỉnh sửa hay không để thay đổi thông điệp ban đầu. Hai phương pháp chỉnh sửa âm thanh nào cho biết rằng video đã được chỉnh sửa để thay đổi thông điệp? (Chọn 2)', NULL, 6)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Âm thanh gốc đã được thay thế bằng nhạc nền', true, 1),
(qid, 'Phụ đề đã được thêm vào âm thanh gốc', false, 2),
(qid, 'Từ ngữ được sắp xếp lại hoặc thêm vào', true, 3),
(qid, 'Giọng thuyết minh giới thiệu người quay phim đã được thêm vào cuối video', false, 4);
END $q6$;


-- Câu hỏi 7: Drag & Drop
DO $q7$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Một người bạn của bạn bị bắt nạt. Bạn ấy cần báo cáo hành vi bắt nạt với ai? Nối mỗi cơ quan có thẩm quyền với hành vi bắt nạt tương ứng', NULL, 7)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Kẻ bắt nạt đăng hàng loạt lời lăng mạ bạn của bạn trên một tài khoản mạng xã hội bị tấn công', 'Nhà cung cấp mạng xã hội', 1),
(qid, 'Kẻ bắt nạt đe dọa sẽ gây tổn thương thể chất tới bạn của bạn', 'Cơ quan hành pháp', 2),
(qid, 'Kẻ bắt nạt viết lời lăng mạ từ bài đăng trên mạng xã hội lên tủ khoá trong lớp thể dục của người bạn kia', 'Khoa trong trường', 3);
END $q7$;


-- Câu hỏi 8: Drag & Drop
DO $q8$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Bạn đang tiến hành nghiên cứu trên mạng trong một tiết học. Với mỗi câu tìm kiếm, hãy chọn Có nếu phải sử dụng toán tử tìm kiếm (Boolean) để hỗ trợ xác định các kết quả liên quan nhanh hơn. Ngược lại, hãy chọn Không.', NULL, 8)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Các sở thú bên ngoài Châu Phi', 'Có', 1),
(qid, 'Thông tin chung về ngựa vằn', 'Không', 2),
(qid, 'Một câu trích dẫn cụ thể của một tác giả nào đó', 'Có', 3),
(qid, 'Voi ở nam bán cầu', 'Có', 4);
END $q8$;


-- Câu hỏi 9: Multi Select
DO $q9$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Xác thực đa yếu tố (MFA) giúp cung cấp bảo mật bổ sung cho tài khoản bằng cách yêu cầu nhập hai hoặc nhiều thông tin đăng nhập khi đăng nhập. Đó là thông tin đăng nhập phổ biến nào? (Chọn 3)', NULL, 9)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Ngày (Date)', false, 1),
(qid, 'Tên người dùng (Username)', false, 2),
(qid, 'Dấu vân tay (Fingerprint)', true, 3),
(qid, 'Mã PIN', true, 4),
(qid, 'Mật khẩu (Password)', true, 5);
END $q9$;


-- Câu hỏi 10: Drag & Drop
DO $q10$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Sắp xếp các bước để cài đặt quyền riêng tư của tài khoản Facebook. Sử dụng Privacy Shortcuts để kiểm tra một số cài đặt quan trọng. Kiểm tra ai có thể xem những gì mà bạn chia sẻ:', NULL, 10)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Chọn mũi tên thả xuống của Tài khoản (Account)', 'Bước 1', 1),
(qid, 'Chọn Cài đặt (Settings)', 'Bước 2', 2),
(qid, 'Chọn Quyền riêng tư (Privacy)', 'Bước 3', 3),
(qid, 'Chọn Kiểm tra một vài cài đặt quan trọng', 'Bước 4', 4),
(qid, 'Chọn Ai có thể xem những gì bạn chia sẻ', 'Bước 5', 5),
(qid, 'Chọn tiếp tục', 'Bước 6', 6);
END $q10$;


-- Câu hỏi 11: Single Choice
DO $q11$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Bạn sao chép một đoạn video dài 30 giây từ internet. Bạn không biết ai đã tạo ra video này. Tùy chọn nào sau đây là trường hợp sử dụng đoạn video Không hợp pháp?', NULL, 11)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Bạn sử dụng đoạn video để dạy học', false, 1),
(qid, 'Bạn tạo nên một bản Parody có sử dụng đoạn video đó', false, 2),
(qid, 'Bạn sử dụng đoạn video trong bản tin', false, 3),
(qid, 'Bạn tạo ra một quảng cáo chính trị có sử dụng đoạn video đó', true, 4);
END $q11$;


-- Câu hỏi 12: Drag & Drop
DO $q12$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Với từng phát biểu sau đây, hãy chọn Bảo vệ nếu là phát biểu giúp bảo vệ tài sản trí tuệ của bạn hoặc chọn Rủi ro nếu là phát biểu mang lại rủi ro cho tài sản trí tuệ của bạn.', NULL, 12)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Đăng ký bản quyền, nhãn hiệu và bằng sáng chế', 'Bảo vệ', 1),
(qid, 'Yêu cầu từng nhân viên ký thỏa thuận không tiết lộ', 'Bảo vệ', 2),
(qid, 'Cấp quyền truy cập không giới hạn các sản phẩm của bạn cho bên thứ ba', 'Rủi ro', 3),
(qid, 'Thảo luận ý tưởng của bạn với thật nhiều người để đánh giá sự quan tâm', 'Rủi ro', 4);
END $q12$;


-- Câu hỏi 13: Drag & Drop
DO $q13$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Bạn đang thực hiện một nghiên cứu trên nền tảng trực tuyến. Khi nào bạn nên sử dụng toán tử tìm kiếm (Boolean)?', NULL, 13)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Để Thu hẹp kết quả tìm kiếm sử dụng phương pháp Kết hợp các thuật ngữ', 'bằng cách sử dụng toán tử AND', 1),
(qid, 'Để Mở rộng kết quả tìm kiếm sử dụng phương pháp Bao gồm nhiều lựa chọn thay thế tìm kiếm', 'bằng cách sử dụng toán tử OR', 2),
(qid, 'Để Thu hẹp kết quả tìm kiếm sử dụng phương pháp Loại trừ', 'bằng cách sử dụng toán tử NOT', 3);
END $q13$;


-- Câu hỏi 14: Single Choice
DO $q14$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Tùy chọn quyền riêng tư nào của Facebook cho phép người dùng chia sẻ thông tin với tất cả bạn bè của họ, ngoại trừ một số lựa chọn?', NULL, 14)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Friends except', true, 1),
(qid, 'Specific friends', false, 2),
(qid, 'Only me', false, 3),
(qid, 'Friends', false, 4),
(qid, 'Public', false, 5);
END $q14$;


-- Câu hỏi 15: Drag & Drop
DO $q15$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Bạn cần bảo vệ thông tin nhận dạng cá nhân (PII) của mình một cách thích hợp. Với mỗi phát biểu sau đây, hãy chọn Đúng hoặc Sai.', NULL, 15)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Thông tin nhận dạng cá nhân (PII) mà các trang web thu thập có thể bị sử dụng cho các mục đích đánh cắp danh tính', 'Đúng', 1),
(qid, 'Việc sử dụng xác thực đa yếu tố làm tăng nguy cơ người khác truy cập PII của bạn', 'Sai', 2),
(qid, 'Việc đóng tài khoản trực tuyến vĩnh viễn sẽ xoá PII của bạn khỏi máy chủ lưu trữ trang web', 'Sai', 3);
END $q15$;


-- Câu hỏi 16: Single Choice
DO $q16$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Em hãy cho biết, phát biểu sau đây là Đúng hay Sai: ''Nếu một cá nhân tận mắt chứng kiến hành vi nguy hiểm, bất hợp pháp hoặc gây hại, thì hành động thích hợp là báo cho nhà chức trách''.', NULL, 16)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Đúng', true, 1),
(qid, 'Sai', false, 2);
END $q16$;


-- Câu hỏi 17: Single Choice
DO $q17$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Hãy điền từ thích hợp vào chỗ trống để hoàn thành phát biểu sau đây: ''___ xảy ra khi ai đó sử dụng các từ hoặc hình ảnh có hại trên mạng để đe dọa, làm tổn thương, xấu hổ hoặc cố tình gây ra ảnh hưởng tiêu cực đến người khác''.', NULL, 17)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Policing', false, 1),
(qid, 'Cyberbullying', true, 2),
(qid, 'Challenging', false, 3),
(qid, 'Tweeting', false, 4);
END $q17$;


-- Câu hỏi 18: Drag & Drop
DO $q18$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Rác thải điện tử (E-waste) là các thiết bị điện tử đã qua sử dụng bị vứt bỏ, được quyên tặng hoặc đưa cho người tái chế. Với mỗi phát biểu về rác thải điện tử, hãy chọn Đúng hoặc Sai.', NULL, 18)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Hơn 60% rác thải điện tử được tái chế', 'Sai', 1),
(qid, 'Rác thải điện tử là loại chất thải phát triển chậm nhất trên toàn thế giới', 'Sai', 2),
(qid, 'Rác thải điện tử chứa các kim loại quý như vàng và bạc có thể được phục hồi và tái sử dụng', 'Đúng', 3),
(qid, 'Rác thải điện tử chứa các kim loại độc hại như chì và thủy ngân là nguyên nhân gây bệnh cho con người nếu chúng ngấm vào nguồn nước ngầm', 'Đúng', 4);
END $q18$;


-- Câu hỏi 19: Single Choice
DO $q19$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Hãy chọn từ thích hợp điền vào chỗ trống để hoàn thành phát biểu sau đây: ''Người dùng nên cố gắng hết sức để giữ bí mật thông tin của họ và thông tin của cấp trên của họ. ___ không nên được viết ra và để lại bất cứ nơi nào mà người khác có thể tình cờ nhìn thấy chúng''.', NULL, 19)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Phone numbers', false, 1),
(qid, 'Email addresses', false, 2),
(qid, 'Work hours', false, 3),
(qid, 'Passwords', true, 4);
END $q19$;


-- Câu hỏi 20: Single Choice
DO $q20$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Nếu ai đó chọn chia sẻ thông tin tài khoản của họ với một người bạn thân, người bạn đó nên làm gì với thông tin đó?', NULL, 20)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Giữ thông tin an toàn', true, 1),
(qid, 'Đánh cắp và chia sẻ thông tin nhận dạng cá nhân', false, 2),
(qid, 'Sử dụng thông tin để mua hàng', false, 3),
(qid, 'Mạo danh bạn bè như một trò đùa', false, 4);
END $q20$;


-- Câu hỏi 21: Drag & Drop
DO $q21$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Bạn phải cập nhật kiến thức về quyền công dân kỹ thuật số của mình. Với mỗi phát biểu sau đây, hãy chọn Có nếu bạn cần phải thường xuyên xem lại kiến thức. Ngược lại, hãy chọn Không.', NULL, 21)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Luật về bản quyền', 'Có', 1),
(qid, 'Các quy tắc ứng xử (Etiquette) trên môi trường kỹ thuật số', 'Có', 2),
(qid, 'Cài đặt quyền riêng tư trên mạng truyền thông xã hội', 'Có', 3);
END $q21$;


-- Câu hỏi 22: Single Choice
DO $q22$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Bạn lên kế hoạch tìm kiếm một công việc trong ngành công nghệ thông tin. Bạn cần cập nhật kiến thức về các công nghệ kỹ thuật số mới nhất. Bạn nên làm gì?', NULL, 22)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Hàng tháng, bạn cần viết một bài đăng trên Blog về công nghệ mới mà bạn quan tâm', false, 1),
(qid, 'Tình nguyện tạo bản tin hàng tháng cho một trường học địa phương', false, 2),
(qid, 'Đăng ký và đọc thông báo từ các trang web công nghệ uy tín', true, 3),
(qid, 'Làm mới kiến thức của bạn về công nghệ kỹ thuật số bằng cách tham gia một lớp học mới ba năm một lần', false, 4);
END $q22$;


-- Câu hỏi 23: Single Choice
DO $q23$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Một trong những cách tốt nhất để giữ bí mật thông tin tài khoản và mật khẩu là gì?', NULL, 23)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Chia sẻ thông tin với gia đình và bạn bè', false, 1),
(qid, 'Tránh chia sẻ thông tin với người khác', true, 2),
(qid, 'Sử dụng miếng dán bảo vệ màn hình', false, 3),
(qid, 'Trả tiền cho một người bạn để giữ thông tin an toàn', false, 4);
END $q23$;


-- Câu hỏi 24: Multi Select
DO $q24$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Người dùng có thể thực hiện một số phương pháp công nghệ lành mạnh nào liên quan đến môi trường? (Chọn 3)', NULL, 24)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Sử dụng các ứng dụng có thể giúp theo dõi mức tiêu thụ nhiên liệu và nước', true, 1),
(qid, 'Tái chế thiết bị cũ', true, 2),
(qid, 'Vứt bỏ các thiết bị cũ', false, 3),
(qid, 'In tất cả các tài liệu mong muốn', false, 4),
(qid, 'Hãy thử thanh toán không cần giấy tờ', true, 5);
END $q24$;


-- Câu hỏi 25: Drag & Drop
DO $q25$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Bạn làm việc cho một công ty thiết kế kiến trúc vào ban ngày và tham gia lớp học thiết kế tại trường cao đẳng cộng đồng vào buổi tối. Bạn có các tài khoản email được cung cấp bởi công ty và trường học. Bạn sử dụng tài khoản Gmail để nhận và gửi email cho các việc cá nhân. Bạn cần gửi một email có chứa các thông tin riêng tư. Bạn không muốn công ty hay trường học biết đến email này. Với mỗi phát biểu sau đây, hãy chọn Có nếu công ty hoặc nhà trường sẽ biết nội dung email. Ngược lại, hãy chọn Không.', NULL, 25)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Gửi email từ một chiếc điện thoại thông minh sử dụng tài khoản email của công ty cấp', 'Có', 1),
(qid, 'Gửi email từ một máy tính tại nơi làm việc sử dụng tài khoản email của công ty cấp', 'Có', 2),
(qid, 'Gửi email từ một máy tính cá nhân sử dụng tài khoản email của trường', 'Có', 3),
(qid, 'Gửi email từ một máy tính của trường sử dụng tài khoản email cá nhân', 'Có', 4);
END $q25$;


-- Câu hỏi 26: Drag & Drop
DO $q26$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Một trách nhiệm của việc trở thành một công dân kỹ thuật số tốt là báo cáo hành vi nguy hiểm, bất hợp pháp hoặc có hại. Chọn Đúng nếu hành vi nguy hiểm, bất hợp pháp hoặc có hại hoặc chọn Sai nếu không.', NULL, 26)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Sau khi lướt qua một vài trang web chơi game, một trang bật lên (Pops Up) trên màn hình máy tính của bạn yêu cầu trả tiền để mở khóa máy tính của bạn', 'Đúng', 1),
(qid, 'Yêu cầu bạn phải tạo một tài khoản để truy cập các chương trình giảm giá đặc biệt trên trang web sản phẩm. Tài khoản muốn tên, địa chỉ, điện thoại và ngày sinh của bạn', 'Sai', 2),
(qid, 'Tạo nhiều hồ sơ trên một trang mạng xã hội - một hồ sơ cho mục đích cá nhân của bạn và một hồ sơ cho mục đích kinh doanh', 'Sai', 3),
(qid, 'Bạn nhận được một email thông báo rằng tài khoản ngân hàng của bạn đã bị xâm phạm và hướng dẫn bạn nhấp vào một liên kết trong email để đăng nhập và chứng minh đó là tài khoản của ban', 'Đúng', 4);
END $q26$;


-- Câu hỏi 27: Single Choice
DO $q27$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Bạn là trợ lý huấn luyện của một giải bóng đá dành cho người lớn. Bạn thu thập thông tin đăng ký của mỗi cầu thủ. Bạn quyết định tạo một danh sách liên hệ của đội. Thông tin nào sau đây của cầu thủ mà bạn KHÔNG được chia sẻ khi chưa có sự đồng ý của cầu thủ?', NULL, 27)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Tên cầu thủ và vị trí của cầu thủ trong đội', false, 1),
(qid, 'Các chứng dị ứng của cầu thủ', true, 2),
(qid, 'Họ và tên của cầu thủ', false, 3),
(qid, 'Thành phố mà cầu thủ đang cư trú', false, 4);
END $q27$;


-- Câu hỏi 28: Multi Select
DO $q28$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Nếu một thách thức Internet gây ra rủi ro về sức khỏe và liên quan đến hoạt động bất hợp pháp, thì điều đó nên được báo cáo cho ai? (Chọn 2)', NULL, 28)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Ông bà', false, 1),
(qid, 'Nền tảng truyền thông xã hội của bài viết', true, 2),
(qid, 'Cảnh sát', true, 3),
(qid, 'Một người bạn', false, 4),
(qid, 'Một cuộc trò chuyện nhóm', false, 5);
END $q28$;


-- Câu hỏi 29: Multi Select
DO $q29$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Người dùng nên tìm kiếm những phẩm chất nào trong kết quả tìm kiếm trực tuyến của họ? (Chọn 2)', NULL, 29)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Hiện hành (Currency)', true, 1),
(qid, 'Quan trọng (Importance)', false, 2),
(qid, 'Không liên quan (Irrelevance)', false, 3),
(qid, 'Thiên kiến (Bias)', false, 4),
(qid, 'Tính khách quan (Objectivity)', true, 5);
END $q29$;


-- Câu hỏi 30: Single Choice
DO $q30$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Kịch bản nào sau đây là được phép sử dụng một bộ phim thương mại? (Lưu ý: Bạn không sở hữu các quyền đối với bộ phim)', NULL, 30)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Bạn đăng phim lên trang Web của mình và cho phép mọi người trả tiền cho bạn mỗi lần họ xem phim', false, 1),
(qid, 'Bạn sử dụng ba khung hình tĩnh từ bộ phim đó vào một bài đánh giá mà bạn đăng trực tuyến. Trang web mà bạn đăng bài đánh giá sẽ tạo ra doanh thu quảng cáo cho bạn', true, 2),
(qid, 'Bạn chiếu phim bên cạnh nhà mình và mời các hàng xóm xem phim miễn phí cùng với bạn', false, 3),
(qid, 'Bạn tạo ra một bản sao của bộ phim và đưa nó cho một người bạn. Người bạn đó đồng ý sẽ xóa bản sao sau khi xem phim', false, 4);
END $q30$;


-- Câu hỏi 31: Single Choice
DO $q31$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Có thể sử dụng toán tử tìm kiếm nào để xem kết quả chứa nhiều từ khóa?', NULL, 31)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'EXCERT', false, 1),
(qid, 'OR', false, 2),
(qid, 'BUT', false, 3),
(qid, 'AND', true, 4);
END $q31$;


-- Câu hỏi 32: Single Choice
DO $q32$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Người dùng có thể tin tưởng vào tiêu đề URL nào với thông tin thẻ tín dụng của họ?', NULL, 32)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, '.com', false, 1),
(qid, 'www', false, 2),
(qid, 'http://', false, 3),
(qid, 'https://', true, 4);
END $q32$;


-- Câu hỏi 33: Drag & Drop
DO $q33$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Bạn phải thực hiện tìm kiếm nhiều thông tin. Nối từng loại tìm kiếm mà bạn cần sử dụng trong danh sách ở cột bên phải tương ứng với câu cần tìm kiếm ở cột bên trái.', NULL, 33)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Một trang cụ thể', 'Điều hướng', 1),
(qid, 'Số liệu thống kê dân số', 'Thông tin', 2),
(qid, 'Các tùy chọn bên thứ ba khi mua phần mềm', 'Giao dịch', 3);
END $q33$;


-- Câu hỏi 34: Multi Select
DO $q34$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Câu chuyện về tài liệu hướng dẫn ôn tập cho kì thi đại học xuất hiện trên nguồn cung cấp tin tức (News Feed) trên mạng truyền thông xã hội của bạn. Câu chuyện chứa nội dung sau đây Một nghiên cứu gần đây được thực hiện trên 1000 sinh viên cho thấy rằng sinh viên đã cải thiện 25% điểm thi của mình khi sử dụng tài liệu hướng dẫn ôn tập này. Một giáo sư đại học nổi tiếng tham gia nghiên cứu đã phát biểu rằng: “Nếu sinh viên không sử dụng tài liệu hướng dẫn ôn tập này, họ có thể không đạt được điểm số cần có để được nhận vào trường cao đẳng hoặc đại học". Bạn thấy rằng nội dung của câu chuyện trên có chứa hai ngụy biện Logic phổ biến và câu trên có thể không chính xác hoặc đã thiên vị. Câu này chứa hai ngụy biện Logic nào sau đây? (Chọn 2)', NULL, 34)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Ngụy biện vin vào truyền thống (Appeal to Tradition), bỏ qua những vấn đề trong quá khứ và cho rằng mọi thứ đã xảy ra trong quá khứ đều tốt đẹp hơn hiện tại', false, 1),
(qid, 'Ngụy biện tấn công cá nhân (Ad hominem), tập trung công kích cá nhân chứ không tấn công vào vấn đề', false, 2),
(qid, 'Ngụy biện song đề sai (False Dilemma), hạn chế các lựa chọn có thể có để tránh việc cân nhắc một lựa chọn khác', true, 3),
(qid, 'Ngụy biện lợi dụng người nổi tiếng (Appeal to Authority), dựa vào uy tín của một chuyên gia có thể được nêu tên hoặc giấu tên, để làm cơ sở cho lập luận', true, 4);
END $q34$;


-- Câu hỏi 35: Multi Select
DO $q35$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Người dùng nên tìm kiếm điều gì để xác định độ tin cậy của tác giả? (Chọn 3)', NULL, 35)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Các bình luận trên mạng xã hội thảo luận về dữ liệu của tác giả', false, 1),
(qid, 'Kinh nghiệm sống của tác giả', true, 2),
(qid, 'Trình độ học vấn của tác giả', true, 3),
(qid, 'Các bài viết khác cùng chủ đề', true, 4),
(qid, 'Thông tin về cuộc sống gia đình của tác giả', false, 5);
END $q35$;


-- Câu hỏi 36: Single Choice
DO $q36$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Bộ lọc tìm kiếm nào sẽ cung cấp cho người dùng kết quả về các mặt hàng họ có thể mua?', NULL, 36)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Images', false, 1),
(qid, 'Maps', false, 2),
(qid, 'Shopping', true, 3),
(qid, 'Videos', false, 4);
END $q36$;


-- Câu hỏi 37: Multi Select
DO $q37$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Lựa chọn nào đóng vai trò tốt nhất trong việc định hình quan điểm của một người nào đó? (Chọn 3)', NULL, 37)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Thực phẩm yêu thích', false, 1),
(qid, 'Tuổi tác', true, 2),
(qid, 'Trình độ học vấn', true, 3),
(qid, 'Đội thể thao yêu thích', false, 4),
(qid, 'Địa vị xã hội', true, 5);
END $q37$;


-- Câu hỏi 38: Multi Select
DO $q38$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Một số tác động tâm lý và thể chất của việc sử dụng công nghệ kỹ thuật số là gì? (Chọn 3)', NULL, 38)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Trầm cảm', true, 1),
(qid, 'Cải thiện tầm nhìn', false, 2),
(qid, 'Ngủ không ngon', true, 3),
(qid, 'Sai tư thế', true, 4),
(qid, 'Cải thiện thính giác', false, 5);
END $q38$;


-- Câu hỏi 39: Drag & Drop
DO $q39$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Bạn đang cố gắng thiết kế một yêu cầu tìm kiếm hiệu quả. Bạn nhận ra rằng trước tiên bạn phải chọn đúng công cụ tìm kiếm. Chọn Đúng nếu công cụ tìm kiếm sẽ trả về kết quả mong muốn hoặc chọn Sai nếu không.', NULL, 39)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Shazam có thể xác định tên của một bài hát', 'Đúng', 1),
(qid, 'TinEye có thể báo cáo lần xuất hiện đầu tiên của một hình ảnh trực tuyến', 'Đúng', 2),
(qid, 'Google xác minh các bài đăng tin tức giả mạo hoặc gây hiểu lầm', 'Sai', 3),
(qid, 'Shodan cho phép bạn tìm kiếm TV thông minh, nhà máy điện, tủ lạnh hoặc bất kỳ loại thiết bị IoT nào được kết nối với Internet', 'Đúng', 4);
END $q39$;


-- Câu hỏi 40: Single Choice
DO $q40$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Biểu tượng nào mà một số trình duyệt Web hiển thị ở bên trái trường địa chỉ web để cho biết rằng một trang web an toàn?', NULL, 40)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Lightbulb', false, 1),
(qid, 'Key', false, 2),
(qid, 'Lock', true, 3),
(qid, 'Bell', false, 4);
END $q40$;