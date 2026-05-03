-- Câu hỏi 1: Single Choice
DO $q1$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Bạn Không thể gửi tập tin nào sau đây thông qua một nhà cung cấp Email tiêu chuẩn như Gmail hay Yahoo?', NULL, 1)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Podcast dài 5 phút có định dạng MP3', false, 1),
(qid, 'Video dài 1 phút có độ phân giải 8K, định dạng AVI', true, 2),
(qid, 'Tập tin văn bản thuần dài 400 trang', false, 3),
(qid, 'Hình GIF động có độ phân giải 1080 với 30 khung hình', false, 4);
END $q1$;


-- Câu hỏi 2: Drag & Drop
DO $q2$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Bạn thấy bạn cùng lớp đăng một số nội dung đáng ngờ trên một trang mạng xã hội. Với mỗi loại nội dung, hãy chọn Có nếu bạn cần báo cáo cho cơ quan hành pháp hoặc Không nếu không cần.', NULL, 2)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Bản sao của bài kiểm tra lịch sử ngày mai', 'Không', 1),
(qid, 'Khiếu nại về một giáo viên cụ thể', 'Không', 2),
(qid, 'Đe doạ bạo lực đối với các thành viên trong câu lạc bộ của trường', 'Có', 3),
(qid, 'Một hình ảnh đáng xấu hổ của bạn cùng lớp', 'Không', 4);
END $q2$;


-- Câu hỏi 3: Drag & Drop
DO $q3$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Bạn là thành viên của một nhóm sinh viên họp trực tuyến vào mỗi buổi sáng. Một trong những thành viên trong nhóm luôn im lặng khi họp trực tuyến. Thành viên trầm lặng thực hiện tốt với kỹ năng công nghệ xuất sắc. Với từng phát biểu về cách thức tương tác với những thành viên nhút nhát hoặc hướng nội, hãy chọn Đúng hoặc Sai.', NULL, 3)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Đưa email và tin nhắn vào kế hoạch công cụ liên lạc trong nhóm', 'Đúng', 1),
(qid, 'Tìm hiểu ý tưởng của người im lặng đó và đề nghị chia sẻ ý tưởng đó với cả nhóm', 'Đúng', 2),
(qid, 'Trong các cuộc hợp trực tuyến, yêu cầu mọi người tắt tiếng, trừ người đang phát biểu', 'Đúng', 3),
(qid, 'Tránh nói về công việc của thành viên im lặng đó vì điều này gây sự chú ý không mong muốn', 'Sai', 4);
END $q3$;


-- Câu hỏi 4: Multi Select
DO $q4$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Ứng dụng nào có khả năng chia sẻ màn hình? (Chọn 3)', NULL, 4)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Teamviewer', true, 1),
(qid, 'Skype', true, 2),
(qid, 'Microsoft Teams', true, 3),
(qid, 'Skyview', false, 4),
(qid, 'Outlook', false, 5);
END $q4$;


-- Câu hỏi 5: Single Choice
DO $q5$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Khi cộng tác trong một dự án, một nhóm có thể cần tạo dòng thời gian và theo dõi các nhiệm vụ được giao. Công cụ nào có tính năng quản lý lịch và công việc?', NULL, 5)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Outlook', true, 1),
(qid, 'Word', false, 2),
(qid, 'Excel', false, 3),
(qid, 'PowerPoint', false, 4);
END $q5$;


-- Câu hỏi 6: Multi Select
DO $q6$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Đặc điểm của một thành viên nhóm có tinh thần xây dựng là gì ? (Chọn 2)', NULL, 6)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Tò mò', true, 1),
(qid, 'Cứng rắn', false, 2),
(qid, 'Tự tin', true, 3),
(qid, 'Ngoan cố', false, 4);
END $q6$;


-- Câu hỏi 7: Drag & Drop
DO $q7$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Người sếp mới của bạn đã chỉ định bạn vào một nhóm dự án. Bạn muốn tạo ấn tượng tốt bằng cách đóng góp xây dựng cho nhóm. Đối với mỗi phát biểu, hãy chọn Đúng nếu đó là đóng góp mang tính xây dựng hoặc Sai nếu không phải:', NULL, 7)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Yêu cầu nhóm xác minh hiểu biết của bạn về mục tiêu dự án và các bước để đạt được mục tiêu đó', 'Đúng', 1),
(qid, 'Hỏi sếp muốn bạn đóng góp như thế nào vào thành công của nhóm', 'Đúng', 2),
(qid, 'Lập tức lên tiếng và ngắt lời bất kì thành viên nào trong nhóm trình bày ý tưởng mà bạn không đồng ý', 'Sai', 3),
(qid, 'Giải thích với nhóm rằng công việc, quyết định và nỗ lực của bạn sẽ không ảnh hưởng đến nhóm', 'Sai', 4);
END $q7$;


-- Câu hỏi 8: Multi Select
DO $q8$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Bạn quản lý một nhóm dự án trong lớp thiết kế kỹ thuật số của mình. Bạn và các thành viên sẽ thực hiện dự án thiết kế cho một doanh nghiệp địa phương. Bạn sắp xếp một cuộc họp trực tuyến với chủ doanh nghiệp để thảo luận về dự án. Bạn cần đảm bảo rằng sau cuộc họp, chủ doanh nghiệp sẽ tự tin rằng nhóm của bạn có thể hoàn thành dự án thành công. Bạn nên thực hiện ba hành động nào? (Chọn 3)', NULL, 8)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Nói theo cách bình thường, thân mật để khách hàng cảm thấy thoải mái và khuyến khích thảo luận', false, 1),
(qid, 'Sau khi khách hàng trình bày ý tưởng, hãy diễn giải lại những gì họ đã nói', true, 2),
(qid, 'Nói với khách hàng rằng bạn sẽ gửi email dự thảo đề xuất, bao gồm cả thời hạn', true, 3),
(qid, 'Thảo luận dài dòng về các ứng dụng thiết kế mà bạn sẽ sử dụng', false, 4),
(qid, 'Cùng khách hàng quyết định những hình thức giao tiếp số sẽ sử dụng trong sự án', true, 5),
(qid, 'Thảo luận về mục tiêu nghề nghiệp của bạn trong lĩnh vực thiết kế kỹ thuật số', false, 6);
END $q8$;


-- Câu hỏi 9: Multi Select
DO $q9$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Những cách mà công ty có thể đảm bảo rằng tất cả các thành viên trong nhóm đều đóng góp vào một cuộc họp hoặc dự án? (Chọn 3)', NULL, 9)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Thúc đẩy sự tôn trọng đối với tất cả thành viên trong nhóm', true, 1),
(qid, 'Tạo một môi trường an toàn', true, 2),
(qid, 'Đe doạ sa thải tất cả những người không đáp', false, 3),
(qid, 'Giao tiếp và đáp ứng các mục tiêu và thời hạn của dự án', true, 4),
(qid, 'Chỉ lắng nghe ý kiến của một số ít thành viên trong nhóm', false, 5);
END $q9$;


-- Câu hỏi 10: Drag & Drop
DO $q10$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Ghép các bước trong chu trình quản lý dự án với mô tả của nó.', NULL, 10)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Các chi tiết của một dự án được thực hiện để tạo ra các sản phẩm dự án', 'Thực hiện (Execution)', 1),
(qid, 'Nhóm giao thành phẩm cho khách hàng và đánh giá dự án', 'Đóng (Close)', 2),
(qid, 'Người quản lý dự án quyết định có theo đuổi một dự án hay không', 'Khởi tạo (Initiation)', 3),
(qid, 'Người quản lý dự án xác định bất kì vấn đề hoặc rủi ro nào xuất hiện trong quá trình đăng kí thực thi', 'Giám sát (Monitoring)', 4),
(qid, 'Người quản lý dự án xác định chi phí, phạm vi và khung thời gian của một dự án', 'Lập kế hoạch (Planning)', 5);
END $q10$;


-- Câu hỏi 11: Single Choice
DO $q11$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Có bao nhiêu bước trong chu trình quản lý dự án?', NULL, 11)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, '5', true, 1),
(qid, '7', false, 2),
(qid, '8', false, 3),
(qid, '4', false, 4);
END $q11$;


-- Câu hỏi 12: Drag & Drop
DO $q12$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Một công ty đang làm việc cùng nhau để giải quyết một vấn đề không mong muốn ảnh hưởng đến nhiều khách hàng của mình. Họ đang sử dụng các công cụ kỹ thuật số để luôn có tổ chức và giao tiếp. Ghép công cụ hoặc phần mềm kỹ thuật số với cách sử dụng tốt nhất có thể của nó trong quá trình cộng tác.', NULL, 12)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Lưu trữ các bản cập nhật dự án và ghi chú cuộc họp', 'OneNote', 1),
(qid, 'Liệt kê thông tin liên hệ của khách hàng ngày liên hệ và thông tin hoàn tiền', 'Bảng tính Excel được đồng ủy quyền', 2),
(qid, 'Lưu trữ tập tin ảnh và video để sử dụng trên phương tiện truyền thông xã hội', 'Dropbox', 3),
(qid, 'Tạo dòng thời gian bằng cách sử dụng lịch và phân công và theo dõi nhiệm vụ', 'Outlook', 4);
END $q12$;


-- Câu hỏi 13: Single Choice
DO $q13$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Bạn bị chậm tiến độ trong việc hoàn thành phần nhiệm vụ của mình trong một dự án nhóm. Tùy chọn nào sau đây là hành động tốt nhất mà bạn nên thực hiện để giao tiếp với nhóm của mình?', NULL, 13)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Mô tả những phần việc bạn đã hoàn thành và yêu cầu các bạn khác hỗ trợ mình cho phần việc còn lại', true, 1),
(qid, 'Giải thích tại sao bạn không đạt đúng tiến độ công việc', false, 2),
(qid, 'Chờ đến khi nào bạn đã hoàn thành công việc của mình thì mới liên lạc với nhóm', false, 3),
(qid, 'Nói với cả nhóm rằng bạn đã phải đảm nhận quá nhiều việc', false, 4);
END $q13$;


-- Câu hỏi 14: Single Choice
DO $q14$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Các công ty nên tạo một hoặc nhiều quy trình …… được sử dụng để quản lý việc hoàn thành các dự án?', NULL, 14)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Có hạn (Finite)', false, 1),
(qid, 'U mê (Obtuse)', false, 2),
(qid, 'Theo chu kỳ (Cyclical)', true, 3),
(qid, 'Vô nghĩa (Nonsensical)', false, 4);
END $q14$;


-- Câu hỏi 15: Multi Select
DO $q15$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Hành động nào sau đây giúp đảm bảo sự tham gia tích cực của tất cả thành viên trong một cuộc họp trực tuyến? (Chọn 2)', NULL, 15)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Điểm danh thành viên đầu buổi họp', true, 1),
(qid, 'Yêu cầu thành viên điều phối từng phân đoạn cuộc họp', true, 2),
(qid, 'Chỉ cho phép người quản lý dự án phát biểu trong suốt cuộc họp', false, 3),
(qid, 'Bỏ qua phần giới thiệu để tiết kiệm thời gian cuộc họp', false, 4);
END $q15$;


-- Câu hỏi 16: Multi Select
DO $q16$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Trường học của bạn chuẩn bị tổ chức một hội chợ khoa học ảo. Bạn là đại sứ sinh viên hỗ trợ điều phối hội chợ khoa học này. Bạn muốn đảm bảo rằng những người học tiếng Anh tham dự hội chợ khoa học cảm thấy được chào đón và sẽ được thông báo đầy đủ về chương trình khoa học của trường. Tùy chọn nào là hành động mà bạn có thể thực hiện để đảm bảo những người tham dự hội chợ khoa học cảm thấy được chào đón và được thông báo đầy đủ? (Chọn 2)', NULL, 16)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Trình bày các dự án hội chợ khoa học bằng tiếng Anh trước, sau đó bằng ngôn ngữ được sửdụng nhiều nhất', false, 1),
(qid, 'Yêu cầu các thành viên trong gia đình biên dịch tại nhà khi các dự án được trình bày', false, 2),
(qid, 'Ngoài việc dùng ngôn ngữ, bạn dùng cử chỉ và hình ảnh để trình bày các dự án hội chợ khoa học, giúp người xem hiểu thông điệp', true, 3),
(qid, 'Sử dụng phần mềm để tạo và hiển thị phụ đề mở bằng ngôn ngữ của khán giả', true, 4);
END $q16$;


-- Câu hỏi 17: Drag & Drop
DO $q17$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Bạn là thành viên của một nhóm dự án. Bạn cần đóng góp ý kiến mang tính xây dựng cho cả nhóm. Với từng phát biểu sau đây, hãy chọn Đúng nếu điều này giúp đóng góp ý kiến mang tính xây dựng hoặc chọn Sai nếu không phải.', NULL, 17)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Hiểu mục tiêu cuối cùng của dự án và các bước để đạt được mục tiêu đó', 'Đúng', 1),
(qid, 'Hiểu rằng công việc, quyết định cũng như nỗ lực của bạn không ảnh hưởng đến nhóm', 'Sai', 2),
(qid, 'Hiểu rõ vai trò của bạn và cách bạn có thể đóng góp tốt nhất vào thành công của cả nhóm', 'Đúng', 3),
(qid, 'Hiểu rằng bạn phải ngay lập tức lên tiếng và ngắt lời người đang trình bày ý kiến khi bạn không đồng ý với ý kiến đó', 'Sai', 4);
END $q17$;


-- Câu hỏi 18: Single Choice
DO $q18$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Bạn bắt đầu kinh doanh nhỏ. Bạn và nhân viên của mình sẽ sử dụng bộ phần mềm cơ bản Microsoft Office để tăng năng suất làm việc. Bạn cần quyết định xem nên cài đặt các ứng dụng trên máy tính hay sử dụng phiên bản trực tuyến. Lợi ích của việc sử dụng ứng dụng trên máy tính so với sử dụng ứng dụng trên nền tảng điện toán đám mây là gì?', NULL, 18)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Phần mềm không phụ thuộc vào kết nối internet', true, 1),
(qid, 'Chi phí trả trước thấp hơn', false, 2),
(qid, 'Phần mềm được cập nhật thường xuyên hơn', false, 3),
(qid, 'Phần mềm sử dụng ít dung lượng lưu trữ của ổ đĩa cứng hơn', false, 4);
END $q18$;


-- Câu hỏi 19: Drag & Drop
DO $q19$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Nhóm của bạn đang phối hợp thực hiện một dự án nhóm trên môi trường ảo. Bạn muốn nhóm của mình và dự án thành công. Với từng phát biểu về các chiến lược để đạt được thành công cho nhóm làm việc trên môi trường ảo, hãy chọn Đúng hoặc Sai.', NULL, 19)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Yêu cầu các thành viên trong nhóm thu thập thông tin trong sổ ghi chép OneNote', 'Đúng', 1),
(qid, 'Tăng hiệu quả bằng cách chỉ sử dụng giao tiếp không đồng bộ', 'Sai', 2),
(qid, 'Tạo bảng thảo luận nhóm dành cho các cuộc trò chuyện liên quan đến dự án', 'Đúng', 3),
(qid, 'Có một vị trí lưu trữ tập tin trung tâm mà tất cả các thành viên trong nhóm đều có thể truy cập', 'Đúng', 4);
END $q19$;


-- Câu hỏi 20: Multi Select
DO $q20$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Bạn là thành viên của một nhóm làm việc cùng nhau trong một dự án đầy thách thức. Nhóm họp trực tuyến một tuần/lần. Trong cuộc họp thứ hai, bạn thấy rằng hai trong số các thành viên của nhóm không quen sử dụng các tính năng của ứng dụng họp ảo. Tùy chọn nào sau đây là hành động hỗ trợ các thành viên trong nhóm của mình? (Chọn 2)', NULL, 20)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Gửi Email hướng dẫn từng bước sử dụng các tính năng của ứng dụng', true, 1),
(qid, 'Khuyến khích mỗi thành viên trong nhóm tự luyện tập trước cuộc họp tiếp theo', false, 2),
(qid, 'Nhắc nhở các thành viên trong nhóm rằng họ phải học cách sử dụng các tính năng', false, 3),
(qid, 'Gửi liên kết đến video đào tạo về các tính năng cho các thành viên trong nhóm', true, 4);
END $q20$;


-- Câu hỏi 21: Multi Select
DO $q21$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Bạn quản lí một nhóm dự án trong lớp thiết kế kỹ thuật số của mình. Bạn và các thành viên trong nhóm sẽ thực hiện dự án thiết kế cho một doanh nghiệp địa phương. Bạn sắp xếp một cuộc họp ảo trực tuyến với chủ doanh nghiệp để thảo luận về dự án. Bạn cần đảm bảo rằng sau cuộc họp, chủ doanh nghiệp sẽ tự tin rằng nhóm của bạn có thể hoàn thành dự án thành công. Bạn nên thực hiện hành động nào sau đây? (Chọn 3)', NULL, 21)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Có một cuộc thảo luận dài về các ứng dụng thiết kế mà bạn sẽ sử dụng', false, 1),
(qid, 'Nói theo cách bình thường, thân mật đặt khách hàng vào một cuộc thảo luận mang tính thoải mái và khích lệ', false, 2),
(qid, 'Sau khi khách hàng trình bày các ý tưởng, hãy diễn giải lại những gì họ nói', true, 3),
(qid, 'Cùng khách hàng quyết định những hình thức giao tiếp kỹ thuật số nào sẽ sử dụng trong suốt quá trình thực hiện dự án', true, 4),
(qid, 'Thảo luận về các mục tiêu nghề nghiệp của bạn trong lĩnh vực thiết kế kỹ thuật số', false, 5),
(qid, 'Nói với khách hàng rằng bạn sẽ gửi Email một bản đề xuất phác thảo bao gồm các thời hạn cuối cùng', true, 6);
END $q21$;


-- Câu hỏi 22: Multi Select
DO $q22$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Những dấu hiệu tiềm ẩn của virus là gì ? (Chọn 3)', NULL, 22)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Ứng dụng thường xuyên gặp sự cố', true, 1),
(qid, 'Có phần mềm không mong muốn được cài đặt trên máy tính', true, 2),
(qid, 'Máy tính bắt đầu hoạt động rất chậm', true, 3),
(qid, 'Các trang Web mong muốn tải lên nhanh chóng', false, 4),
(qid, 'Máy tính hoạt động bình thường', false, 5);
END $q22$;


-- Câu hỏi 23: Multi Select
DO $q23$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Bạn nên quyét Virus vì lí do nào? (Chọn 2)', NULL, 23)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Máy tính của bạn bắt đầu chạy chậm hơn bình thường', true, 1),
(qid, 'Một chương trình bạn không khởi động mà tự vận hành', true, 2),
(qid, 'Bạn nhận được một Email từ một cửa hang trực tuyến sau khi đặt hang ở đó', false, 3),
(qid, 'Quảng cáo bật lên xuất hiện một trang Web', false, 4);
END $q23$;


-- Câu hỏi 24: Drag & Drop
DO $q24$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Bạn cần tối đa hoá quyền riêng tư trực tuyến của mình. Đối với mỗi hành động sau đây, bạn hãy chọn Có nếu hành động giúp tăng quyền riêng tư trực tuyến, ngược lại, hãy chọn Không.', NULL, 24)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Duy trì đăng nhập vào các trang Web', 'Không', 1),
(qid, 'Xoá Cookie sau khi sử dụng trình duyệt Web', 'Có', 2),
(qid, 'Sử dụng cùng một thông tin đăng nhập cho nhiều tài khoản khác nhau', 'Không', 3),
(qid, 'Mở tất cả các Email để đảm bảo chúng không chứa phần mềm độc hại', 'Không', 4);
END $q24$;


-- Câu hỏi 25: Drag & Drop
DO $q25$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Với mỗi phương thức xác thực, hãy chọn Có nếu đó là một phần của phương thức xác thực đa yếu tố hoặc chọn Không nếu không phải.', NULL, 25)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Các dữ liệu sinh trắc học như dấu vân tay của bạn', 'Có', 1),
(qid, 'Mã bảo mật ở sau thẻ tín dụng', 'Không', 2),
(qid, 'Mã PIN được khởi tạo qua SMS mà bạn nhận được bằng tin nhắn văn bản', 'Có', 3),
(qid, 'Thông báo CAPTCHA kiểm tra xem người dùng là người thật hay Robot', 'Không', 4);
END $q25$;


-- Câu hỏi 26: Multi Select
DO $q26$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'multi', 'Hậu quả của việc đăng vị trí hiện tại của một người khi đang đi nghỉ dưỡng là gì? (Chọn 2)', NULL, 26)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Những người khác sẽ biết vị trí của người đăng bài', true, 1),
(qid, 'Những người khác sẽ đi nghỉ dưỡng', false, 2),
(qid, 'Những người khác sẽ nghĩ rằng người đăng bài đang ở nhà', false, 3),
(qid, 'Những người khác sẽ biết rằng nhà của người đăng bài đang bỏ trống', true, 4);
END $q26$;


-- Câu hỏi 27: Single Choice
DO $q27$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'choice', 'Nếu một người dùng thường xuyên sử dụng Internet, họ nên quét Virus trên máy tính của mình bao lâu một lần ?', NULL, 27)
RETURNING id INTO qid;

INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
(qid, 'Mỗi tháng một lần', false, 1),
(qid, 'Mỗi ngày', false, 2),
(qid, 'Ít khi', false, 3),
(qid, 'Hai đến ba lần mỗi tuần', true, 4);
END $q27$;


-- Câu hỏi 28: Drag & Drop
DO $q28$
DECLARE
qid uuid;
BEGIN
INSERT INTO questions (exam_id, question_type, content, image_url, order_index)
VALUES ('034de6ea-9e75-4cd4-ba9f-e7eeda50b2df'::uuid, 'dragdrop', 'Ghép các tùy chọn quét Virus trên máy tính sử dụng hệ điều hành Windows 10 với các chức năng tương ứng.', NULL, 28)
RETURNING id INTO qid;

INSERT INTO dragdrop_pairs (question_id, drag_content, drop_content, order_index) VALUES
(qid, 'Quét nhanh để kiểm tra các thư mục nơi mà các Virus thường ẩn nấp', 'Quét nhanh (Quick scan)', 1),
(qid, 'Quét kỹ toàn bộ để kiểm tra tất cả các tập tin và chương trình đang chạy trên đĩa cứng', 'Quét toàn bộ (Full Scan)', 2),
(qid, 'Tùy chọn quét được thiết kế để loại bỏ Virus và phần mềm độc hại khó bị phát hiện', 'Quét ngoại tuyến của Windows Defender (Windows Defender Offline Scan)', 3),
(qid, 'Tùy chọn quét mà người dùng có thể chỉ định những tập tin và những vị trí mà họ muốn quét', 'Quét tùy chỉnh (Custom Scan)', 4);
END $q28$;
