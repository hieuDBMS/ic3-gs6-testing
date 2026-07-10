# IC3 Exam Platform — Routes & Pages

## Route Structure (App.jsx)

```
/login               → LoginPage          (public)
/register            → RegisterPage       (public)
--- ProtectedRoute (any authenticated) ---
/dashboard           → DashboardPage
/exam                → ExamListPage
/exam/:examId        → ExamPage
/exam/:examId/result → ResultPage          (dùng attemptId thay examId khi navigate)
/mock-exam           → MockExamSetupPage
/mock-exam/:attemptId        → MockExamPage
/mock-exam/:attemptId/result → MockResultPage
/flashcard           → FlashcardListPage
/flashcard/:examId   → FlashcardPage
/payments            → PaymentHistoryPage
/teacher/payment-settings → PaymentSettingsPage
--- ProtectedRoute (teacher only) ---
/questions                    → QuestionsPage
/questions/new                → QuestionFormPage
/questions/:id/edit           → QuestionFormPage (edit mode)
/questions/import             → QuestionImportPage
/teacher/exam-structure       → ExamStructurePage
/teacher/students             → StudentManagementPage
/teacher/students/:studentId  → StudentProgressPage
/teacher/question-stats       → QuestionStatsPage
/teacher/live-monitor         → LiveMonitorPage
/teacher/analytics            → AnalyticsPage
/ and *              → redirect /dashboard
```

Layout: Tất cả protected routes đều wrap trong `<Layout>` (Navbar + main content).

## Chi tiết từng Page

### LoginPage (`/login`)
- File: `src/pages/LoginPage.jsx`
- Form email + password, hoặc username (không có @ → convert thành `username@ic3fighter.local`)
- Gọi `AuthContext.login()`
- Sau login → redirect `/dashboard`

### RegisterPage (`/register`)
- File: `src/pages/RegisterPage.jsx`
- Form: username, fullName, password, confirmPassword
- Validation: username ≥4 ký tự, chỉ [a-zA-Z0-9_], password ≥6 ký tự
- Gọi Edge Function `register-user`
- Sau success → redirect `/login` sau 2.5s

### DashboardPage (`/dashboard`)
- File: `src/pages/DashboardPage.jsx`
- **Student**: StatCard (tổng bài, điểm TB, tỉ lệ pass) + `AttemptHistoryTable`
- **Teacher**: Thêm `StudentOverviewTable` + link /teacher/students
- Stats fetch từ `exam_attempts` table
- Avatar: initials từ `full_name` với màu gradient ngẫu nhiên (hash-based)

### ExamListPage (`/exam`)
- File: `src/pages/ExamListPage.jsx`
- Danh sách bài thi nhóm theo Version (GS6, GS7...) → Level → Testing/Gmetrix
- Self-registered users: hiển thị Lock icon, nút Mua → `PaymentModal`
- Accordion expand/collapse từng Level
- Fetch: `exam_levels`, `exams`, `exam_purchases` (user)
- VERSION_STYLES: màu cho mỗi version (GS6=primary, GS7=violet, GS8=accent)

### ExamPage (`/exam/:examId`)
- File: `src/pages/ExamPage.jsx` (821 lines — file lớn nhất trong pages)
- **Luồng**: initExam → fetch exam + questions → insert attempt → render
- **State chính**: exam, questions, currentIndex, answers ({}), flagged ([]), attemptId
- **Keyboard shortcuts**: ArrowLeft/Right/W/A/S/D để navigate, F5/Ctrl+R → RefreshWarningModal
- **Fullscreen**: `useExamFullscreen` hook → requestFullscreen trên container (navbar ẩn)
- **Anti-cheat**: log `tab_switch` và `fullscreen_exit` vào `exam_cheat_events` table
- **Live progress ping**: update `current_question_index` + `last_activity_at` throttle 4s
- **Submit**: gọi RPC `submit_exam_attempt` → navigate `/exam/${attemptId}/result`
- **Auto-submit**: Timer callback → doSubmit(true)
- **Self-registered check**: gọi RPC `user_can_access_exam`, nếu không → redirect /exam

**Data fetched khi init exam:**
```js
questions.select(`
  id, content, image_url, question_type, order_index, hotspot_multi,
  answers ( id, content, image_url, is_correct, order_index ),
  dragdrop_pairs ( id, drag_content, drag_image_url, drop_content, drop_image_url, order_index ),
  truefalse_statements ( id, content, is_true, order_index ),
  hotspot_regions ( id, x, y, width, height, is_correct, label, order_index )
`)
```

**Answers format gửi lên RPC:**
- choice/multi/hotspot: `p_answers[q.id] = [answerId, ...]`
- truefalse: `p_tf_answers[q.id] = { statementId: true|false }`
- dragdrop: `p_dd_answers[q.id] = { pairId: dropContent }`

### ResultPage (`/exam/:examId/result`)
- File: `src/pages/ResultPage.jsx` (539 lines)
- **Lưu ý**: URL param là `examId` nhưng thực ra là `attemptId`!
- Fetch: `attempt_answers` join `questions, answers, dragdrop_pairs, truefalse_statements, hotspot_regions`
- `ScoreRing`: SVG circle animation cho score
- `QuestionCard`: collapsible, expand sai answers by default
- Certificate download: `generateCertificatePdf()` từ `utils/certificate.js` (canvas → PDF)
- Nút "Làm lại": navigate `/exam/${attempt.exam_id}`

### QuestionsPage (`/questions`) — Teacher only
- File: `src/pages/QuestionsPage.jsx` (751 lines)
- Pagination: 20/trang
- Filter: version, level_id, exam_type, exam_id, question_type, search, order_index range
- Sort options: created_at asc/desc, order_index asc/desc, content asc/desc
- **State persistence**: sessionStorage key `questionsPage_state` (filters, sortOption, page)
- Navigate đến `/questions/new` hoặc `/questions/:id/edit`

### QuestionFormPage (`/questions/new` và `/questions/:id/edit`) — Teacher only
- File: `src/pages/QuestionFormPage.jsx` (602 lines)
- Form: level → exam_type → exam → question_type → content → answers/pairs/statements/regions
- Q_TYPES: choice, multi, dragdrop, truefalse, hotspot
- Components: `ImageUploader`, `AnswerEditor`, `HotspotEditor`, `RichTextEditor`
- Edit mode: load data từ DB, prefill form

### QuestionImportPage (`/questions/import`) — Teacher only
- File: `src/pages/QuestionImportPage.jsx`
- Upload CSV hoặc XLSX file
- Sheets: `choice_multi`, `dragdrop`, `truefalse`
- Parse bằng `questionImport.js` (`parseCsvText`, `parseWorkbookFile`)

### StudentManagementPage (`/teacher/students`) — Teacher only
- File: `src/pages/StudentManagementPage.jsx` (948 lines — file lớn nhất)
- Pagination: 20/trang
- CRUD student: tạo, sửa tên, reset password, xóa
- Gọi Edge Function `manage-student`
- Link → `/teacher/students/:studentId` để xem tiến độ
- Không thể xóa teacher khác

### ExamStructurePage (`/teacher/exam-structure`) — Teacher only
- File: `src/pages/ExamStructurePage.jsx` (573 lines)
- Quản lý `exam_levels` và `exams` (CRUD)
- Thêm Version mới → tự tạo Level 1
- Thêm Level vào Version
- Thêm/sửa/xóa exam (Testing/Gmetrix) trong Level

### AnalyticsPage (`/teacher/analytics`) — Teacher only
- File: `src/pages/AnalyticsPage.jsx`
- Filter: level, examType, passFilter (all/pass/fail), school, class, dateFrom, dateTo, groupBy
- Charts: `ScoreDistributionChart`, `GroupBreakdownChart`
- Fetch từ: `exam_levels`, `schools`, `classes`
- AI Insight: gọi Edge Function để phân tích

### QuestionStatsPage (`/teacher/question-stats`) — Teacher only
- File: `src/pages/QuestionStatsPage.jsx`
- Gọi RPC `get_question_wrong_stats`
- Hiển thị câu hay sai nhất với % sai màu đỏ/vàng/xanh

### LiveMonitorPage (`/teacher/live-monitor`) — Teacher only
- File: `src/pages/LiveMonitorPage.jsx`
- Fetch `exam_attempts` status=`in_progress` + `exam_cheat_events`
- Realtime subscriptions: `exam_attempts` và `exam_cheat_events` tables
- Cutoff: chỉ lấy attempts trong `MAX_EXAM_DURATION_SECONDS=6000 + GRACE_SECONDS=120`
- Auto-refresh: setInterval 1000ms cập nhật đồng hồ elapsed
- Pagination: 12/trang

### MockExamSetupPage (`/mock-exam`)
- File: `src/pages/MockExamSetupPage.jsx`
- Cấu hình bài thi thử: chọn level, số câu, thời gian

### MockExamPage (`/mock-exam/:attemptId`)
- File: `src/pages/MockExamPage.jsx` (688 lines)
- Tương tự ExamPage nhưng KHÔNG có anti-cheat logging
- Dùng chung: Timer, QuestionNavigator, QuestionRenderer

### FlashcardListPage (`/flashcard`)
- File: `src/pages/FlashcardListPage.jsx`
- Chọn bài thi để học flashcard

### FlashcardPage (`/flashcard/:examId`)
- File: `src/pages/FlashcardPage.jsx` (1127 lines — file lớn nhất)
- Chế độ học flashcard: hiển thị câu hỏi → chọn đáp án → reveal
- Hỗ trợ shuffle (Fisher-Yates)
- `scoreAnswer()`: chấm điểm client-side cho tất cả question types
- Keyboard shortcuts: Space=flip, Arrow keys navigate

### PaymentSettingsPage (`/teacher/payment-settings`) — Teacher only
- File: `src/pages/PaymentSettingsPage.jsx`
- Cấu hình VietQR: chọn bank (MB, VCB, TCB...), số TK, tên TK
- `QRPreview`: hiển thị QR code live từ `img.vietqr.io`
- Quản lý giá bài thi per-exam

### PaymentHistoryPage (`/payments`)
- File: `src/pages/PaymentHistoryPage.jsx`
- Lịch sử giao dịch của user
- Hủy giao dịch pending: gọi Edge Function `manage-purchase`

### StudentProgressPage (`/teacher/students/:studentId`) — Teacher only
- File: `src/pages/StudentProgressPage.jsx`
- Xem chi tiết tiến độ của một student

## Redirect Logic

- `/` → `/dashboard`
- `*` (unknown) → `/dashboard`
- Unauthenticated → `/login`
- Student truy cập teacher-only → `/dashboard`
