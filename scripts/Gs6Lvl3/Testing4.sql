-- Câu hỏi 1: Single Choice
DO $q1$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Sử dụng . . . . . . có thể giúp những người bị mù màu phân biệt giữa các thành phần biểu đồ khác nhau. (Chọn 1)', NULL, 1)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Small Text', false, 1),
(qid, 'Numbers', false, 2),
(qid, 'Textures', true, 3),
(qid, 'Bright Colors', false, 4);
END $q1$;


-- Câu hỏi 2: Multi Select
DO $q2$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Tuỳ chọn nào sau đây giúp chỉnh sửa video trên iPhone? (Chọn 3)', NULL, 2)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Điêu khắc (Sculpting)', false, 1),
(qid, 'Viền (Edging)', false, 2),
(qid, 'Cắt (Trimming)', true, 3),
(qid, 'Thêm bộ lọc (Adding Filters)', true, 4),
(qid, 'Điều chỉnh độ sáng (Adjusting Brightness)', true, 5);
END $q2$;


-- Câu hỏi 3: Single Choice
DO $q3$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Câu hỏi nào tốt nhất để một người đặt ra khi xác định mục đích của dự án của họ? (Chọn 1)', NULL, 3)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Khách hàng phải trả bao nhiêu cho dự án', false, 1),
(qid, 'Bạn muốn người khác biết hoặc đạt được điều gì từ thông tin bạn chia sẻ', true, 2),
(qid, 'Bạn nên sử dụng cài đặt trước nào', false, 3),
(qid, 'Các số liệu và thông tin nhân khẩu học (Demographics) của khán giả như thế nào?', false, 4);
END $q3$;


-- Câu hỏi 4: Drag & Drop
DO $q4$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Bạn đang tạo nội dung cho một trang Web. Bạn cần tuân thủ các tiêu chuẩn về khả năng tiếp cận. Hoàn thành các câu dưới đây bằng cách lựa chọn tùy chọn đúng từ mỗi danh sách thả xuống.', NULL, 4)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Kiểu phông chữ ưa chuộng là', 'Sans-serif', 1),
(qid, 'Bạn cần duy trì . . . . . . . . . . . . . giữa màu chữ và màu nền.', 'Độ tương phản cao', 2),
(qid, 'Kích thước phông chữ được khuyến nghị tối thiểu cho văn bản nội dung của trang Web là', '11 point/15 pixel', 3);
END $q4$;


-- Câu hỏi 5: Multi Select
DO $q5$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Trường của bạn yêu cầu bạn thiết kế một trang Web để theo dõi việc tham gia vào các câu lạc bộ của sinh viên. Bạn tập hợp các thành viên trong nhóm của mình để đưa ra các ý tưởng để giải quyết vấn đề trên. Hành động nào sau đây sẽ có ích cho quá trình hình thành ý tưởng? (Chọn 2)', NULL, 5)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Chỉ chia sẻ những ý tưởng mà bạn cảm thấy rất tự tin', false, 1),
(qid, 'Khuyến khích các ý tưởng táo bạo', true, 2),
(qid, 'Đặt giới hạn mỗi thành viên trong nhóm chỉ đưa ra một hoặc hai ý tưởng', false, 3),
(qid, 'Không chỉ trích các ý tưởng của những thành viên khác trong nhóm', true, 4);
END $q5$;


-- Câu hỏi 6: Drag & Drop
DO $q6$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Bạn đang chuẩn bị chạy thử nghiệm trên Prototype của một trang Web mới. Tùy chọn nào sau đây là mục tiêu nghiên cứu tốt để thử nghiệm với Prototype? Đối với mỗi phát biểu, hãy chọn Đúng nếu đó là một mục tiêu/câu hỏi nghiên cứu tốt để thử nghiệm hoặc Sai nếu không phải:', NULL, 6)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Tôi muốn kiểm tra việc điều hướng trong trang Web của mình', 'Đúng', 1),
(qid, 'Tôi muốn thử nghiệm Prototype của mình', 'Sai', 2),
(qid, 'Tôi muốn kiểm tra xem người dùng có thể tìm thấy các sản phẩm cụ thể hay không', 'Đúng', 3),
(qid, 'Tôi muốn kiểm tra xem phiên bản Prototype nào mà người dùng thích', 'Đúng', 4);
END $q6$;


-- Câu hỏi 7: Single Choice
DO $q7$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Trong tiết khoa học, bạn cần phân tích các bảng số liệu. Bạn nên sử dụng ứng dụng phần mềm nào sau đây? (Chọn 1)', NULL, 7)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Google Sheets', true, 1),
(qid, 'Adobe InDesign', false, 2),
(qid, 'Microsoft PowerPoint', false, 3),
(qid, 'Intuit QuickBooks', false, 4);
END $q7$;


-- Câu hỏi 8: Drag & Drop
DO $q8$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Bạn hãy nối mỗi ứng dụng được liệt kê trong danh sách ở cột bên phải với loại nội dung tương ứng của nó ở cột bên trái.', NULL, 8)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Bạn thực hiện các thao tác trên một tập hợp dữ liệu lớn bằng cách sử dụng các công thức', 'Microsoft Excel', 1),
(qid, 'Bản đề xuất dự án bao gồm nhiều trang với mục lục và các chỉ mục được tạo tự động', 'Microsoft Word', 2),
(qid, 'Bản trình chiếu trực quan, sinh động tự động chuyển tiếp từ chủ đề này sang chủ đề khác trên máy tính mà không cần bất cứ người nào điều khiển', 'Microsoft PowerPoint', 3);
END $q8$;


-- Câu hỏi 9: Single Choice
DO $q9$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Bạn đã chụp bức ảnh sân trước của mình và có một con sóc cáu kỉnh đang ngồi trên bãi cỏ mà bạn muốn loại bỏ. Công cụ nào sau đây có thể giúp tự động loại bỏ con sóc và thay thế nhiều cỏ hơn trong bức ảnh? (Chọn 1)', NULL, 9)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Sử dụng Magic Wand', false, 1),
(qid, 'Layer > New Fill Layer', false, 2),
(qid, 'Sử dụng Spot Healing Brush', true, 3);
END $q9$;


-- Câu hỏi 10: Multi Select
DO $q10$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Bạn đang chuẩn bị một bài thuyết trình về quá trình tăng dân số ở thành phố của bạn qua nhiều năm. Bạn cần trình bày hiệu quả sự gia tăng dân số theo thời gian. Hình thức hiển thị trực quan nào sau đây là hiệu quả nhất? (Chọn 2)', NULL, 10)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Biểu đồ thanh (Bar Chart)', true, 1),
(qid, 'Biểu đồ đường (Line Chart)', true, 2),
(qid, 'Biểu đồ tròn (Pie Chart)', false, 3),
(qid, 'Biểu đồ dạng bản đồ (map)', false, 4);
END $q10$;


-- Câu hỏi 11: Drag & Drop
DO $q11$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Nối từng loại phương tiện kỹ thuật số trong danh sách ở cột bên phải tương ứng với mục tiêu giao tiếp kỹ thuật số trong danh sách ở cột bên trái.', NULL, 11)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Công khai xác nhận chất lượng sản phẩm yêu thích của bạn', 'Mạng xã hội', 1),
(qid, 'Tạo một khóa học để mọi người có thể nghe trong lúc họ di chuyển', 'Âm thanh', 2),
(qid, 'Trình diễn vũ đạo mới cho đội múa của trường', 'Video', 3);
END $q11$;


-- Câu hỏi 12: Drag & Drop
DO $q12$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Bạn đang tạo một trang Web dễ dàng tiếp cận. Bạn cần xác định các tiêu chuẩn thực tiễn tốt nhất giúp người khiếm thị có thể truy cập trang Web. Với mỗi hành động thiết kế sau đây, hãy chọn Đúng nếu đó là một tiêu chuẩn thực tiễn tốt nhất. Ngược lại, hãy chọn Không.', NULL, 12)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Sử dụng màu sắc tương phản', 'Đúng', 1),
(qid, 'Sử dụng hoạ tiết (Texture) để thể hiện độ tương phản', 'Đúng', 2),
(qid, 'Sử dụng màu sắc để truyền tải thông tin', 'Sai', 3),
(qid, 'Sử dụng bảng màu đơn sắc', 'Sai', 4);
END $q12$;


-- Câu hỏi 13: Multi Select
DO $q13$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Tùy chọn nào sau đây là cách chỉnh sửa video được sử dụng để biến đổi video với mục đích thay đổi ý nghĩa gốc của nội dung? (Chọn 2)', NULL, 13)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Hiển thị một đoạn clip tóm tắt của một đoạn video dài hơn', true, 1),
(qid, 'Chỉnh sửa bằng cách ghép nhiều phần nhỏ của các video khác nhau lại với nhau', true, 2),
(qid, 'Ghi công cho những người xuất hiện trong video và người quay phim trong phần cuối của video', false, 3),
(qid, 'Ở cuối video, hiển thị các siêu liên kết đến các nguồn đáng tin cậy để ủng hộ, tăng thêm độ tin cậy cho thông điệp của video', false, 4);
END $q13$;


-- Câu hỏi 14: Drag & Drop
DO $q14$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Nối từng loại biểu đồ trong danh sách ở cột bên phải với mục tiêu hiển thị trực quan tương ứng của nó ở cột bên trái.', NULL, 14)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Cho thấy mối tương quan và sự phân bổ của một lượng lớn dữ liệu', 'Biểu đồ phân tán (Scatter Plot)', 1),
(qid, 'Hiển thị cách một hoặc nhiều chuỗi dữ liệu (Data series) thay đổi theo thời gian', 'Biểu đồ đường (Line Graph)', 2),
(qid, 'Minh họa các mối quan hệ từng phần (Part to whole relation) đơn giản trong một tập dữ liệu nhỏ', 'Biểu đồ tròn (Pie Chart)', 3);
END $q14$;


-- Câu hỏi 15: Drag & Drop
DO $q15$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Bạn muốn tạo một ứng dụng trò chơi trên điện thoại di động. Thứ tự các bước để tạo một ứng dụng trò chơi là gì? Đặt các hành động theo đúng thứ tự.', NULL, 15)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Biến ý tưởng trò chơi của bạn thành một câu chuyện bằng cách trả lời các câu hỏi về nhân vật của bạn', 'Bước 1', 1),
(qid, 'Lên kế hoạch để trò chơi trở nên hấp dẫn', 'Bước 2', 2),
(qid, 'Thiết kế tác phẩm nghệ thuật tuyệt đẹp', 'Bước 3', 3),
(qid, 'Tích hợp chiến lược kiếm tiền', 'Bước 4', 4),
(qid, 'Chọn nền tảng ngôn ngữ lập trình để viết mã', 'Bước 5', 5),
(qid, 'Chọn lập trình viên phù hợp', 'Bước 6', 6);
END $q15$;


-- Câu hỏi 16: Multi Select
DO $q16$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Bạn đang bắt đầu mở một cửa hàng bánh tại nhà. Bạn lên kế hoạch tạo một trang Web để khách hàng có thể đặt các đơn hàng giao tận nơi và các đơn hàng đến cửa hàng để lấy. Lý do nào sau đây mà bạn nên tạo một bản mẫu (Prototype) cho biểu mẫu đặt hàng của mình? (Chọn 2)', NULL, 16)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Để quảng cáo về cửa hàng của mình', false, 1),
(qid, 'Để tìm ra những sai sót trong thiết kế của bạn', true, 2),
(qid, 'Để cho phép khách hàng đặt hàng trước khi bắt đầu ra mắt trang Web', false, 3),
(qid, 'Để kiểm nghiệm xem giải pháp đó có hiệu quả hay không', true, 4);
END $q16$;


-- Câu hỏi 17: Single Choice
DO $q17$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Các cá nhân nên làm gì để tạo ra một cộng đồng học tập và hiểu biết an toàn? (Chọn 1)', NULL, 17)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Bỏ qua các ý kiến khác nhau', false, 1),
(qid, 'Chỉ giao tiếp với những người cùng chí hướng', false, 2),
(qid, 'Lắng nghe ý kiến của người khác', true, 3),
(qid, 'Gửi những thông điệp gây tổn thương cho những người không đồng ý về một chủ đề', false, 4);
END $q17$;


-- Câu hỏi 18: Multi Select
DO $q18$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Những cách nào sau đây để một công ty có thể chuyển tiếp thông tin kỹ thuật số đến khách hàng của họ? (Chọn 3)', NULL, 18)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Mail', false, 1),
(qid, 'Phone call', false, 2),
(qid, 'Video Conferencing', true, 3),
(qid, 'Email', true, 4),
(qid, 'Instant Messaging', true, 5);
END $q18$;


-- Câu hỏi 19: Multi Select
DO $q19$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Điều nào nên tránh trong giáo tiếp chuyên nghiệp? (Chọn 3)', NULL, 19)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Sử dụng phần mềm chuyển lời nói thành văn bản', true, 1),
(qid, 'Đúng chính tả', false, 2),
(qid, 'Các từ viết tắt', true, 3),
(qid, 'Đúng ngữ pháp', false, 4),
(qid, 'Biểu tượng cảm xúc', true, 5);
END $q19$;


-- Câu hỏi 20: Multi Select
DO $q20$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Bạn là thành viên của một nhóm sinh viên đang tạo một trang Web cho một tổ chức tình nguyện địa phương. Sau cuộc gặp lần gần đây nhất của bạn với khách hàng, khách hàng đã nói với giáo viên của bạn rằng nhóm của bạn cần cải thiện kỹ năng giao tiếp. Tùy chọn nào sau đây là hành động mà bạn có thể thực hiện để cải thiện kỹ năng giao tiếp của mình? (Chọn 2)', NULL, 20)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Khi nói chuyện với khách hàng, hãy nói với giọng điệu tích cực, tôn trọng', true, 1),
(qid, 'Khi khách hàng đặt câu hỏi, hãy tóm tắt lại câu hỏi trước khi bạn trả lời', true, 2),
(qid, 'Nhắn tin cho khách hàng để xin lỗi vì kỹ năng giao tiếp kém', false, 3),
(qid, 'Để một thành viên khác trong nhóm tiếp quản việc giao tiếp trong cuộc họp tiếp theo', false, 4);
END $q20$;


-- Câu hỏi 21: Single Choice
DO $q21$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Một Resort trong rừng đã được đặt hết phòng cho kì nghỉ mùa thu, nhưng một tuần trước một vụ cháy rừng đã xảy ra trong khu vực, làm hư hại và đóng cửa con đường dẫn đến Resort. Cách nào sau đây là tốt nhất để Resort chuyển tin tức về thiệt hại do hỏa hoạn cho khách hàng? (Chọn 1)', NULL, 21)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Tổ chức hội nghị truyền hình', false, 1),
(qid, 'Gửi một lá thư', false, 2),
(qid, 'Gửi tin nhắn văn bản ngắn gọn', false, 3),
(qid, 'Gửi một Email chi tiết', true, 4);
END $q21$;


-- Câu hỏi 22: Multi Select
DO $q22$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Em hãy cho biết, tùy chọn nào sau đây là ví dụ về phần mềm năng suất? (Chọn 2)', NULL, 22)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Google Play', false, 1),
(qid, 'Apple Store', false, 2),
(qid, 'Google Workspace', true, 3),
(qid, 'Microsoft Office', true, 4);
END $q22$;


-- Câu hỏi 23: Single Choice
DO $q23$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Người dùng nên tự hỏi điều gì về tin nhắn của họ trước khi nó được gửi đi? (Chọn 1)', NULL, 23)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Tin nhắn có hài hước không', false, 1),
(qid, 'Có bao nhiêu biểu tượng cảm xúc trong tin nhắn?', false, 2),
(qid, 'Người nhận sẽ nhận thấy những từ sai chính tả?', false, 3),
(qid, 'Người nhận có thể hiểu sai thông điệp không?', true, 4);
END $q23$;


-- Câu hỏi 24: Drag & Drop
DO $q24$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Bạn được yêu cầu xử lý những đánh giá không hài lòng và tức giận từ khách hàng trực tuyến. Bạn cần xác định cách tùy chỉnh tin nhắn để gửi đến những khách hàng này. Với mỗi tuỳ chỉnh sau đây, hãy chọn Đúng nếu bạn nên thực hiện tuỳ chỉnh này, ngược lại hãy chọn Sai.', NULL, 24)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Đưa ra giải pháp cho các vấn đề mà khách hàng nêu lên', 'Đúng', 1),
(qid, 'Chỉ xin lỗi nếu khách hàng khiếu nại đúng', 'Sai', 2),
(qid, 'Nói với những khách hàng không hài lòng rằng nhiều khách hàng khác đã đánh giá tích cực về công ty của bạn', 'Sai', 3);
END $q24$;


-- Câu hỏi 25: Multi Select
DO $q25$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Gần đây, lớp của bạn đã hoàn thành các dự án nhóm. Bạn đang chuẩn bị một bài thuyết trình về dự án của nhóm mình. Nhóm của bạn sẽ trình bày trực tiếp bài thuyết trình và sẽ được phát trực tiếp cho những người xem trực tuyến. Bạn cần đảm bảo rằng khán giả trực tuyến có thể xem và nghe được bài thuyết trình của bạn. Tùy chọn nào sau đây là hành động làm tăng mức độ tương tác của khán giả trong buổi thuyết trình? (Chọn 2)', NULL, 25)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Nói với giọng đều đều nhẹ nhàng', false, 1),
(qid, 'Khuyến khích tham gia bằng các cuộc thăm dò ý kiến hoặc các câu hỏi yêu cầu những người tham gia cần sử dụng tính năng giơ tay ảo', true, 2),
(qid, 'Để các thành viên trong nhóm lần lượt trình bày thông tin', true, 3),
(qid, 'Đọc to, rõ ràng nội dung của từng trang chiếu trong bài thuyết trình', false, 4);
END $q25$;


-- Câu hỏi 26: Multi Select
DO $q26$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Trường học của bạn chuẩn bị tổ chức một hội chợ khoa học ảo. Bạn là đại sứ sinh viên hỗ trợ điều phối hội chợ khoa học này. Bạn muốn đảm bảo rằng những người học tiếng Anh tham dự hội chợ khoa học cảm thấy được chào đón và sẽ được thông báo đầy đủ về chương trình khoa học của trường. Tùy chọn nào sau đây là hành động mà bạn có thể thực hiện để đảm bảo những người tham dự hội chợ khoa học ảo sẽ cảm thấy được chào đón và được thông báo đầy đủ thông tin? (Chọn 2)', NULL, 26)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Sử dụng phần mềm để tạo và hiển thị phụ đề mở bằng ngôn ngữ của khán giả', true, 1),
(qid, 'Trước tiên, trình bày các dự án hội chợ khoa học bằng tiếng Anh, sau đó trình bày dưới dạng văn bản sử dụng ngôn ngữ được sử dụng nhiều nhất', false, 2),
(qid, 'Ngoài việc sử dụng ngôn ngữ, bạn nên sử dụng cử chỉ và thành phần đồ họa trực quan để trình bày các dự án hội chợ khoa học, giúp những người xem hiểu thông điệp mà không phụ thuộc vào ngôn ngữ', true, 3),
(qid, 'Yêu cầu các thành viên trong gia đình phiên dịch tại nhà trong khi các dự án được trình bày', false, 4);
END $q26$;


-- Câu hỏi 27: Drag & Drop
DO $q27$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Bạn là sinh viên mới tốt nghiệp tại một trường đại học. Một trong những trách nhiệm của bạn là dạy kèm cho sinh viên đăng kí các khóa học giao tiếp kinh doanh năm thứ nhất. Kỳ thi giữa kì đang đến gần và bạn đang ôn tập các chủ đề với một nhóm 30 sinh viên. Bạn nhận thấy hầu hết các sinh viên đều nhầm lẫn về thông tin bạn đang trình bày. Bạn nhận ra rằng bạn phải tham gia với họ theo cách giúp mở rộng sự hiểu biết và học hỏi lẫn nhau. Đối với mỗi phát biểu, hãy chọn Đúng nếu mở rộng sự hiểu biết và học hỏi lẫn nhau hoặc chọn Sai nếu không.', NULL, 27)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Phân tích các câu hỏi bài tập của sinh viên', 'Sai', 1),
(qid, 'Xác định khu vực nhầm lẫn và giải thích theo cách khác', 'Đúng', 2),
(qid, 'Hỏi sinh viên xem họ có bất kì câu hỏi nào muốn hỏi hay không', 'Đúng', 3),
(qid, 'Xem lại tất cả các chủ đề một lần nữa', 'Sai', 4),
(qid, 'Cung cấp tài liệu phát tay các thuật ngữ và định nghĩa kinh doanh cơ bản', 'Sai', 5);
END $q27$;


-- Câu hỏi 28: Single Choice
DO $q28$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Khi trình bày trong môi trường ảo với khán giả, người dung nên làm gì? (Chọn 1)', NULL, 28)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Đọc to từng trang trình chiếu', false, 1),
(qid, 'Khuyến khích tương tác từ khán giả', true, 2),
(qid, 'Sử dụng GIF, biểu tượng cảm xúc và từ viết tắt trong bản trình chiếu', false, 3),
(qid, 'Bao gồm âm nhạc lớn trong bản trình chiếu', false, 4);
END $q28$;


-- Câu hỏi 29: Multi Select
DO $q29$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Người ta có thể làm gì để hiểu rõ nhất và thu hút đối tượng mục tiêu của họ? (Chọn 2)', NULL, 29)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Tìm hiểu về sở thích của họ', true, 1),
(qid, 'Bán thông tin của họ cho người mua bên thứ ba', false, 2),
(qid, 'Xác định giá trị của họ', false, 3),
(qid, 'Nghiên cứu các đối tượng khác', false, 4),
(qid, 'Tìm hiểu về nhân khẩu học của họ', true, 5);
END $q29$;


-- Câu hỏi 30: Multi Select
DO $q30$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Những cách nào để xử lý các đánh giá tiêu cực trên trang Web của công ty hoặc trang truyền thông xã hội? (Chọn 2)', NULL, 30)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Đề nghị rằng tình huống tiêu cực là lỗi của họ', false, 1),
(qid, 'Công khai tố cáo họ với tư cách là khách hàng', false, 2),
(qid, 'Cung cấp cho họ thông tin liên hệ của công ty', true, 3),
(qid, 'Nói với họ rằng họ có thẻ đưa doanh nghiệp của mình đi nơi khác', false, 4),
(qid, 'Thừa nhận và xin lỗi về mối quan ngại được nêu trong bài đánh giá', true, 5);
END $q30$;


-- Câu hỏi 31: Single Choice
DO $q31$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Khi có điều gì đó không mong muốn phát sinh trong một công ty, tùy chọn nào nên được thực hiện trước khi liên hệ với các khách hàng bị ảnh hưởng? (Chọn 1)', NULL, 31)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Công ty nên quyết định chỉ nhắn tin hoặc gọi điện cho khách hàng', false, 1),
(qid, 'Không có gì; khách hàng có quyền biết nếu có vấn đề ngay lập tức', false, 2),
(qid, 'Công ty nên hiểu vấn đề và xác định giải pháp cho vấn đề', true, 3),
(qid, 'Công ty sẽ mất nhiều tháng để xác định giải pháp tốt nhất', false, 4);
END $q31$;


-- Câu hỏi 32: Drag & Drop
DO $q32$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Với từng phát biểu về giao tiếp kỹ thuật số với khách hàng và đồng nghiệp, hãy chọn Đúng hoặc Sai.', NULL, 32)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Tránh đề cập trực tiếp mục đích của tin nhắn', 'Sai', 1),
(qid, 'Sử dụng các biểu tượng đánh dấu đầu dòng hoặc đánh số đầu dòng cho danh sách để sắp xếp chi tiết trong nội dung thư điện tử', 'Đúng', 2),
(qid, 'Sử dụng các từ viết tắt và chữ viết tắt trong tất cả các thư để đảm bảo ngắn gọn', 'Sai', 3),
(qid, 'Khi bạn cần khách hàng lựa chọn, hãy cung cấp nhiều lựa chọn để giảm thiểu việc trao đổi qua lại', 'Đúng', 4);
END $q32$;


-- Câu hỏi 33: Multi Select
DO $q33$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Tùy chọn nào sau đây có thể gây ra sự mơ hồ trong giao tiếp bằng văn bản? (Chọn 3)', NULL, 33)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Những tín hiệu phi ngôn ngữ không thể phủ nhận', false, 1),
(qid, 'Chính tả kém', true, 2),
(qid, 'Dấu câu kém', true, 3),
(qid, 'Ngữ pháp kém', true, 4),
(qid, 'Hướng dẫn rõ ràng', false, 5);
END $q33$;


-- Câu hỏi 34: Single Choice
DO $q34$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Để mở rộng sự hiểu biết và học hỏi lẫn nhau, mọi người tham gia vào một cuộc trò chuyện phải đồng ý về một chủ đề. Chọn Đúng hoặc Sai.', NULL, 34)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Đúng', false, 1),
(qid, 'Sai', true, 2);
END $q34$;


-- Câu hỏi 35: Single Choice
DO $q35$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Đối tượng nào sau đây có thể hiểu rõ nhất về chữ viết tắt của Textspeak và GIF?. (Chọn 1)', NULL, 35)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Thế hệ người cao tuổi', false, 1),
(qid, 'Thanh niên hiểu biết về công nghệ', true, 2),
(qid, 'Cá nhân không có điện thoại thông minh', false, 3),
(qid, 'Trẻ nhỏ', false, 4);
END $q35$;


-- Câu hỏi 36: Single Choice
DO $q36$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Dây an toàn của người đàn ông bị hỏng khi anh ta đang đu dây qua một khu rừng. Anh ấy bị thương nặng và công ty vận động viên trượt ván cần thông báo cho người thân trong liên hệ khẩn cấp (Emergency Contact) của anh ta. Làm thế nào để đại diện công ty truyền đạt thông tin cho người liên hệ khẩn cấp của người đàn ông? (Chọn 1)', NULL, 36)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Gọi điện thoại (Phone call)', true, 1),
(qid, 'Gửi thư điện tử (Email)', false, 2),
(qid, 'Đăng bài lê mạng xã hội (Social media post)', false, 3),
(qid, 'Gửi tin nhắn văn bản (Text message)', false, 4);
END $q36$;


-- Câu hỏi 37: Single Choice
DO $q37$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Lớp khoa học của bạn đã được chia thành các đội. Mỗi đội phải xây dựng một bài thuyết trình trực tuyến cho một trường Tiểu học. Nhóm của bạn đã được chỉ định xây dựng một bài thuyết trình cho học sinh từ 5 đến 6 tuổi. Nhóm của bạn cần đảm bảo khán giả sẽ xem và nghe bài thuyết trình của bạn. Hành động nào sẽ giúp tăng mức độ tương tác của khán giả trong buổi thuyết trình của bạn? (Chọn 1)', NULL, 37)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Hỏi học sinh những gì họ muốn học, sau đó trình bày một cách ngẫu hứng', false, 1),
(qid, 'Đặt một hình ảnh trên mỗi trang chiếu. Giữ câu chuyện cho mỗi Slide thật ngắn gọn và thú vị', true, 2),
(qid, 'Chỉ sử dụng hình ảnh trong bài thuyết trình của bạn mà không nói chuyện', false, 3),
(qid, 'Đặt toàn bộ kịch bản cho bài thuyết trình của bạn trên các Slide để khán giả có thể đọc nó', false, 4);
END $q37$;


-- Câu hỏi 38: Drag & Drop
DO $q38$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Với từng phát biểu về giao tiếp kỹ thuật số với khách hàng và đồng nghiệp, hãy chọn Đúng hoặc Sai.', NULL, 38)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Các công ty được phép giám sát các bài đăng trên mạng xã hội của bạn', 'Đúng', 1),
(qid, 'Bạn có thể bị sa thải vì những thông điệp đăng trên mạng xã hội vào thời gian rảnh', 'Đúng', 2),
(qid, 'Công ty có thể hạn chế những gì bạn đăng tải trên các tài khoản mạng xã hội cá nhân của mình', 'Đúng', 3);
END $q38$;


-- Câu hỏi 39: Single Choice
DO $q39$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Một nhân viên viết một thông điệp chính thức với định dạng chuyên nghiệp. Tin nhắn có nhiều khả năng sẽ được gửi cho ai nhất? (Chọn 1)', NULL, 39)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Một đồng nghiệp', false, 1),
(qid, 'Giám đốc điều hành (CEO)', true, 2),
(qid, 'Cha mẹ', false, 3),
(qid, 'Một người bạn', false, 4);
END $q39$;


-- Câu hỏi 40: Multi Select
DO $q40$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Người đại diện của công ty nên hành động như thế nào khi thông báo tin xấu cho khách hàng (chọn 3) ?', NULL, 40)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Nói lớn tiếng', false, 1),
(qid, 'Cảm thông', true, 2),
(qid, 'Trung thực', true, 3),
(qid, 'Không tức giận', true, 4);
END $q40$;
