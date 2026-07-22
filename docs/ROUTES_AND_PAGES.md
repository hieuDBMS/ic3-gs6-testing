# IC3 Exam Platform — Routes & Pages

## Route Structure (App.jsx)

```
/                    → RootRoute          (public — LandingPage nếu chưa login, redirect /dashboard nếu đã login)
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
/leaderboard         → LeaderboardPage
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
*                    → redirect /dashboard
```

Layout: Tất cả protected routes đều wrap trong `<Layout>` (Navbar + main content).

## Chi tiết từng Page

### RootRoute (`/`)
- File: `src/components/shared/RootRoute.jsx`
- Public — không nằm trong `<ProtectedRoute>`, đọc trực tiếp `useAuth()` (giống `ProtectedRoute` dùng)
- Chưa đăng nhập → render `LandingPage` (lazy-load riêng, không qua `App.jsx`'s lazy block)
- Đã đăng nhập → `<Navigate to="/dashboard" replace />`
- **Trước 2026-07-10 route này redirect thẳng `/dashboard` không điều kiện** — giờ có landing page công khai

### LandingPage (`/` khi chưa đăng nhập)
- File: `src/pages/LandingPage.jsx`
- Trang giới thiệu công khai, song ngữ (VI/EN qua `react-i18next`, xem PATTERNS_AND_CONVENTIONS.md → i18n Pattern)
- Nav bar riêng (không phải `Navbar.jsx` — component đó `return null` khi chưa có `profile`), có language + theme toggle
- Sections: Hero → Trust bar (GS6/GS7/GS8) → Features (6 items) → How it works (4 bước) → For Teachers → CTA band → Footer
- Không hiển thị giá cụ thể (giá là per-exam do giáo viên tự cấu hình qua `PaymentSettingsPage`, không có mức giá cố định toàn hệ thống) — CTA chỉ dẫn tới `/register`/`/login`
- **For Teachers section không có CTA "Tôi là Giáo viên" → `/register`** (đã bỏ): Edge Function `register-user` luôn tạo `role: 'student'`, không có cách tự đăng ký tài khoản giáo viên qua landing page — tài khoản giáo viên do admin/giáo viên khác tạo qua `StudentManagementPage`/DB trực tiếp. Section giờ chỉ còn nội dung giới thiệu (badge, title, subtitle, items), không có nút bấm.
- Tái dùng design token có sẵn: `bg-ic3-gradient`, `.btn-primary`/`.btn-ghost`, `.card`, `.glass-light` (không thêm màu/animation library mới)

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
- **Student**: StatCard (tổng bài, điểm TB, tỉ lệ pass, **streak luyện tập** — thêm 2026-07-15) + `AttemptHistoryTable`
- **Streak card** (student, thêm 2026-07-15): hiển thị `getEffectiveStreak(profile.last_streak_date, profile.current_streak)` (KHÔNG dùng thẳng `profile.current_streak` — cột thô chỉ cập nhật lúc nộp bài, cần tính lại "đã gãy chuỗi chưa" tại thời điểm đọc, xem `utils/streak.js`) + sub-label kỷ lục `longest_streak`. Banner cảnh báo "sắp mất streak" (`isStreakAtRisk`) hiện khi còn streak > 0 nhưng chưa làm bài hôm nay
- **Teacher**: Thêm `StudentOverviewTable` + link /teacher/students
- Student stats: `useExamAttempts(userId, ...)` (scoped theo user, có filter) — fetch trực tiếp `exam_attempts`, ổn vì đã filter theo 1 user.
- **Teacher stats** (`useTeacherStats`, dòng ~56): gọi RPC `get_teacher_dashboard_stats()` — aggregate `COUNT`/`AVG` server-side, trả về 1 dòng. **Trước 2026-07-13** gọi `useExamAttempts(null, ...)` (userId=null → không filter user) fetch TOÀN BỘ `exam_attempts` platform-wide mỗi lần trang Dashboard (landing page sau login) load — đã sửa vì đây là trang tải thường xuyên nhất trong app.
- Avatar: initials từ `full_name` với màu gradient ngẫu nhiên (hash-based)
- **Xoá lịch sử làm bài** (thêm 2026-07-13, teacher-only): nút "Xoá lịch sử của tôi" cạnh tiêu đề "Lịch sử làm bài (Cá nhân)" — teacher tự xoá `exam_attempts` của chính mình (action `clear-attempts`, studentId=chính họ) qua Edge Function `manage-student`, remount `AttemptHistoryTable` (đổi `key`) sau khi xoá. `AttemptHistoryTable` truyền `canDelete={isTeacher}` → student thường không thấy nút xoá từng dòng, chỉ teacher

### ExamListPage (`/exam`)
- File: `src/pages/ExamListPage.jsx`
- Danh sách bài thi nhóm theo Version (GS6, GS7...) → Level → Testing/Gmetrix
- Self-registered users: hiển thị Lock icon, nút Mua → `PaymentModal`
- Accordion expand/collapse từng Level
- Fetch: `exam_levels`, `exams`; trạng thái mua qua Edge Function `manage-purchase` (không query bảng `purchases` trực tiếp)
- VERSION_STYLES: màu cho mỗi version (GS6=primary, GS7=violet, GS8=accent)

### ExamPage (`/exam/:examId`)
- File: `src/pages/ExamPage.jsx` (~1200 lines)
- **Luồng**: initExam → fetch exam + questions → **check attempt `in_progress` cũ** (xem "Resume session" bên dưới) → insert attempt (nếu không có) → render
- **State chính**: exam, questions, currentIndex, answers ({}), flagged ([]), attemptId, existingAttempt
- **Keyboard shortcuts**: ArrowLeft/Right/W/A/S/D để navigate, F5/Ctrl+R → RefreshWarningModal
- **Fullscreen**: `useExamFullscreen` hook → requestFullscreen trên container (navbar ẩn)
- **Anti-cheat**: log `tab_switch` và `fullscreen_exit` vào `exam_cheat_events` table
- **Live progress ping**: update `current_question_index` + `last_activity_at` throttle 4s
- **Submit**: gọi RPC `submit_exam_attempt` → navigate `/exam/${attemptId}/result`
- **Auto-submit**: Timer callback → doSubmit(true)
- **Self-registered check**: gọi RPC `user_can_access_exam`, nếu không → redirect /exam

**Resume session (chống trùng session khi thoát giữa chừng):**
- `initExam()` query `exam_attempts` tìm attempt `status='in_progress' AND is_mock=false` của user cho đúng exam này (`.maybeSingle()`, KHÔNG `.single()`) **trước khi** insert attempt mới.
- Nếu tìm thấy → set `existingAttempt`, render chặn bằng `ResumeModal` (2 nút):
  - **"Tiếp tục làm bài"** → dùng lại `existingAttempt.id`, `currentIndex = existingAttempt.current_question_index`. Đáp án đã chọn trước đó **không** được khôi phục (chỉ vị trí câu hỏi), vì `attempt_answers` chỉ ghi lúc submit, không ghi theo từng câu.
  - **"Bắt đầu lại"** → update attempt cũ `status='auto_submitted', submitted_at=now()` rồi insert attempt mới như bình thường (KHÔNG gọi RPC submit vì chưa có answers).
- Nếu không có → giữ nguyên flow cũ (insert attempt mới ngay).

**Navigate-away guard (chặn rời trang thi mà không xác nhận):**
- App dùng `<BrowserRouter>` thường (không phải `createBrowserRouter`) nên **`useBlocker` của react-router-dom v7 không dùng được** (throw nếu gọi ngoài data router). Thay vào đó chặn thủ công ở tầng DOM:
  - Click-intercept ở `document` (capture phase): bắt mọi `<a href>` nội bộ (navbar/logo) **và** phần tử có attribute `data-nav-guard="true"` (nút Đăng xuất trong `Navbar.jsx` — vì đó là `<button onClick>`, không phải `<a>`, nên href-sniffing không bắt được).
  - `popstate` sentinel: push 1 history entry rỗng khi có `attemptId`, back-button sẽ pop entry đó thay vì rời trang thật, cho phép chặn lại và hỏi xác nhận.
  - Khi xác nhận "Rời khỏi" → **re-dispatch click gốc** trên phần tử đã bắt được (`el.click()` với flag bypass tạm) thay vì tự đoán route rồi gọi `navigate()` — đảm bảo hành vi gốc chạy đúng (Link navigate thật, hoặc logout thật), không cần ExamPage biết ngữ nghĩa của từng nút.
  - Modal: `NavigateAwayModal` (style giống `RefreshWarningModal`).
- Không auto-submit / không đổi `status` khi unmount hay khi rời trang — attempt cũ vẫn `in_progress`, được xử lý bởi Resume session (ở trên) + LiveMonitorPage zombie filter (xem LiveMonitorPage bên dưới).

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
- File: `src/pages/ResultPage.jsx` (~555 lines)
- **Lưu ý**: URL param là `examId` nhưng thực ra là `attemptId`!
- Fetch: `attempt_answers` join `questions, answers, dragdrop_pairs, truefalse_statements, hotspot_regions`
- `ScoreRing`: SVG circle animation cho score
- `QuestionCard`: collapsible, expand sai answers by default
- Certificate download: `generateCertificatePdf()` từ `utils/certificate.js` (canvas → PDF) — **dynamic `import()`** trong `handleDownloadCertificate` (thêm 2026-07-13), không import tĩnh ở đầu file nữa. `certificate.js` kéo theo `jsPDF` (~130kB gzip riêng 1 chunk) — ResultPage là trang mọi học sinh ghé sau MỌI lần thi, import tĩnh trước đây khiến chunk trang này nặng gấp ~20 lần (412kB → 21kB minified) dù đa số học sinh không bấm tải chứng chỉ
- Nút "Làm lại": navigate `/exam/${attempt.exam_id}`

### QuestionsPage (`/questions`) — Teacher only
- File: `src/pages/QuestionsPage.jsx` (~705 lines)
- Pagination: 20/trang
- Filter: version, level_id, exam_type, exam_id, question_type, search, order_index range
- Sort options: created_at asc/desc, order_index asc/desc, content asc/desc
- **State persistence**: sessionStorage key `questionsPage_state` (filters, sortOption, page)
- Navigate đến `/questions/new` hoặc `/questions/:id/edit`

### QuestionFormPage (`/questions/new` và `/questions/:id/edit`) — Teacher only
- File: `src/pages/QuestionFormPage.jsx` (~660 lines)
- Form: level → exam_type → exam → question_type → content → answers/pairs/statements/regions
- Q_TYPES: choice, multi, dragdrop, truefalse, hotspot
- Components: `ImageUploader`, `AnswerEditor`, `HotspotEditor`, `RichTextEditor`
- Edit mode: load data từ DB, prefill form

### QuestionImportPage (`/questions/import`) — Teacher only
- File: `src/pages/QuestionImportPage.jsx`
- Upload CSV hoặc XLSX file
- Sheets: `choice_multi`, `dragdrop`, `truefalse`
- Parse bằng `questionImport.js` (`parseCsvText`, `parseWorkbookFile`)
- `ExcelJS` kéo theo **dynamic `import()`** bên trong `parseWorkbookFile()`/`buildTemplateWorkbook()` (thêm 2026-07-13), không import tĩnh ở đầu `questionImport.js` nữa — thư viện nặng ~940kB minified (~271kB gzip), import tĩnh trước đây khiến chunk trang này nặng nhất toàn app (958kB) dù phần lớn thời gian trên trang chỉ để xem hướng dẫn/chọn loại sheet trước khi thực sự tải file lên. Sau khi tách: chunk trang còn ~20kB, ExcelJS chỉ tải khi bấm "Tải template" hoặc chọn file `.xlsx`

### StudentManagementPage (`/teacher/students`) — Teacher only
- File: `src/pages/StudentManagementPage.jsx` (~965 lines)
- Pagination: 20/trang
- CRUD student: tạo, sửa tên, reset password, xóa
- Gọi Edge Function `manage-student`
- Gán `school` (text tự do, khớp `schools.name`) + `class_name` cho student qua modal `edit-school`
- **CRUD trường học** (bảng `schools`) qua Edge Function `manage-school`: action `list`/`create`/`update`/`delete`. `update` có fallback: nếu Edge Function lỗi → gọi trực tiếp `supabase.from('schools').update(...)`
- Link → `/teacher/students/:studentId` để xem tiến độ
- Không thể xóa teacher khác
- **Xoá lịch sử làm bài** (thêm 2026-07-13, không đụng tài khoản): mỗi dòng có nút Eraser riêng (action `clear-attempts`, xoá `exam_attempts` của 1 student) + nút "Xoá TOÀN BỘ lịch sử làm bài" trên header (action `clear-all-attempts`, xoá `exam_attempts` toàn hệ thống — student/teacher đều bị xoá lịch sử, nhưng `profiles`/`purchases`/`payment_history` giữ nguyên). Cả 2 qua Edge Function `manage-student`, có `ConfirmDialog` riêng, tách biệt hoàn toàn với action `delete` (xoá tài khoản)

### ExamStructurePage (`/teacher/exam-structure`) — Teacher only
- File: `src/pages/ExamStructurePage.jsx` (~540 lines)
- Quản lý `exam_levels` và `exams` (CRUD)
- Thêm Version mới → tự tạo Level 1
- Thêm Level vào Version
- Thêm/sửa/xóa exam (Testing/Gmetrix) trong Level

### AnalyticsPage (`/teacher/analytics`) — Teacher only
- File: `src/pages/AnalyticsPage.jsx`
- Filter: level, examType, passFilter (all/pass/fail), school, class, dateFrom, dateTo, groupBy
- Charts: `ScoreDistributionChart`, `GroupBreakdownChart`
- Data: 3 RPC song song — `get_exam_score_distribution`, `get_exam_group_breakdown`, `get_question_wrong_stats` (worst 8 câu)
- Filter options fetch từ: `exam_levels`, `schools`, `profiles.class_name` (distinct, role=student)
- **AI Insight**: nút "Sparkles" gọi Edge Function `analyze-exam-stats` (teacher-only, body: `{ filters, distribution, breakdown }`) → Gemini 2.5 Flash sinh nhận xét tiếng Việt 3-5 câu. Lỗi nếu thiếu secret `GEMINI_API_KEY` trên server

### QuestionStatsPage (`/teacher/question-stats`) — Teacher only
- File: `src/pages/QuestionStatsPage.jsx`
- Gọi RPC `get_question_wrong_stats`
- Hiển thị câu hay sai nhất với % sai màu đỏ/vàng/xanh

### LiveMonitorPage (`/teacher/live-monitor`) — Teacher only
- File: `src/pages/LiveMonitorPage.jsx` (200 lines)
- Fetch `exam_attempts` status=`in_progress` + `exam_cheat_events`
- Realtime subscriptions: `exam_attempts` và `exam_cheat_events` tables (event `*`, không filter `status` server-side — filter client-side qua refetch, xem comment trong file)
- **Cutoff — CHỈ dựa vào `last_activity_at`, KHÔNG dựa vào `started_at`/`duration_seconds`**: `ACTIVITY_TIMEOUT_SECONDS=60`. Floor query (`gte('last_activity_at', now-60s)`) và filter client đều dùng cùng ngưỡng này.
  - Lý do bỏ cutoff theo `started_at+duration` (từng có trước đây): ExamPage giờ có Resume session (xem trên) — attempt resume giữ nguyên `started_at` gốc, có thể đã trôi qua lâu hơn `duration_seconds` của bài thi. Cutoff theo `started_at` sẽ ẩn nhầm một session **đang thực sự hoạt động** chỉ vì nó khởi tạo từ lâu. `last_activity_at` (ping mỗi ~4s từ ExamPage) là tín hiệu "còn sống" duy nhất đáng tin.
- **Zombie tự ẩn không cần network**: `liveAttempts` (`useMemo` phụ thuộc `now` — state tick mỗi giây có sẵn) lọc lại `attempts` theo `now - last_activity_at <= ACTIVITY_TIMEOUT_SECONDS`. Card biến mất đúng lúc vượt ngưỡng dù không có write DB mới nào xảy ra (session zombie thì chính nó không tạo ra event nào để tự trigger refetch) — đã verify: 0 request mạng phát sinh trong suốt quá trình 1 card tự ẩn.
- Ngưỡng "stale" (card mờ, chữ cam) hiển thị ở `ACTIVITY_TIMEOUT_SECONDS/2` = 30s, trước khi card biến mất hẳn ở 60s.
- Auto-refresh: setInterval 1000ms cập nhật đồng hồ elapsed (đồng thời drive `liveAttempts` re-filter)
- Pagination: 12/trang, dùng `liveAttempts.length` (không phải `attempts.length` thô) cho badge/empty-state/pagination

### MockExamSetupPage (`/mock-exam`)
- File: `src/pages/MockExamSetupPage.jsx`
- Chọn Version (GS6/GS7/GS8, lưu localStorage `ic3_preferred_version`) → chọn Level → "Bắt đầu thi thử"
- Self-registered: nếu chưa mua đủ **tất cả** exam trong Level → chỉ được 10 câu "Dùng thử" (badge amber); nếu đã mua đủ → 45 câu đầy đủ. Check trạng thái mua qua Edge Function `manage-purchase` action `list-mine`
- Nếu Level chưa có exam `gmetrix` nào → nút bị disable ("Chưa có GMetrix")
- Bấm nút → gọi RPC `create_mock_exam_attempt(p_level_id, p_user_id)` → nhận về `attemptId` → navigate `/mock-exam/${attemptId}`
- 50 phút, mức đạt 700/1000 (hiển thị tĩnh trong UI — logic pass thật nằm ở `MockResultPage`)

### MockExamPage (`/mock-exam/:attemptId`)
- File: `src/pages/MockExamPage.jsx` (~945 lines)
- Tương tự ExamPage, **có anti-cheat logging giống hệt** (`tab_switch`/`fullscreen_exit` → `exam_cheat_events`, toast cảnh báo `mockExam.cheatWarning`) — thêm 2026-07-16, trước đó trang này không log
- Dùng chung: Timer, QuestionNavigator, QuestionRenderer
- Load câu hỏi theo `exam_attempts.mock_question_ids` (đã chốt sẵn lúc `create_mock_exam_attempt`), không phải theo 1 exam cụ thể
- Submit: gọi RPC `submit_mock_exam_attempt` (cùng chữ ký `submit_exam_attempt`) → trả về thêm `score_1000` → navigate `/mock-exam/${attemptId}/result`
- Lỗi `already_submitted` khi submit lại → vẫn navigate sang trang kết quả thay vì báo lỗi
- **Không có Resume session** — `attemptId` truyền qua URL param, tạo sẵn 1 lần ở `MockExamSetupPage` (`create_mock_exam_attempt`), không có nguy cơ tạo trùng attempt như ExamPage.
- **Có Navigate-away guard** giống ExamPage (click-intercept `<a href>` + `data-nav-guard` + popstate sentinel → `NavigateAwayModal`), guard theo state `attempt` (chỉ set khi `status==='in_progress'`) thay vì theo `attemptId` (vốn luôn có sẵn từ URL param).

### MockResultPage (`/mock-exam/:attemptId/result`)
- File: `src/pages/MockResultPage.jsx`
- Đọc `attempt.score_1000`; pass nếu `score_1000 >= 700` (hard-code, KHÔNG dùng `utils/scoreUtils.js`)

### FlashcardListPage (`/flashcard`)
- File: `src/pages/FlashcardListPage.jsx`
- Chọn bài thi để học flashcard

### FlashcardPage (`/flashcard/:examId`)
- File: `src/pages/FlashcardPage.jsx` (~1225 lines — file lớn nhất trong pages)
- Chế độ học flashcard: hiển thị câu hỏi → chọn đáp án → reveal
- Hỗ trợ shuffle (Fisher-Yates)
- `scoreAnswer()`: chấm điểm client-side cho tất cả question types
- Keyboard shortcuts: Space=flip, Arrow keys navigate

### LeaderboardPage (`/leaderboard`) — thêm 2026-07-15/16, chưa có trong docs trước đây
- File: `src/pages/LeaderboardPage.jsx` (189 lines)
- Bảng xếp hạng **opt-in** theo streak luyện tập hoặc số bài đã hoàn thành, phạm vi lớp / trường / toàn hệ thống (chip chọn scope, disable nếu profile không có `class_name`/`school`)
- Student thấy toggle "Hiện tôi trên bảng xếp hạng" (RPC `set_leaderboard_opt_in`) — mặc định TẮT (`profiles.leaderboard_opt_in=false`). Teacher không thấy toggle này (không tham gia bảng xếp hạng)
- Data: RPC `get_leaderboard` (top N, mặc định 50) + `get_my_leaderboard_rank` (hạng của chính user kể cả ngoài top hiển thị, chỉ query khi đã opt-in) — cả 2 qua `useLeaderboard.js` (TanStack Query), xem COMPONENTS.md → Custom Hooks
- Cố tình **không** hiển thị điểm trung bình — chỉ streak/số bài, tránh áp lực điểm số
- Xem DATABASE_SCHEMA.md → `profiles` (cột `current_streak`/`longest_streak`/`last_streak_date`/`leaderboard_opt_in`) và RPC section cho chi tiết SQL (`supabase/sql/2026-07-15_leaderboard_streak.sql`)

### PaymentSettingsPage (`/teacher/payment-settings`) — Teacher only
- File: `src/pages/PaymentSettingsPage.jsx`
- Cấu hình VietQR: chọn bank (MB, VCB, TCB...), số TK, tên TK — ghi vào bảng singleton `payment_config` (id=1)
- `QRPreview`: hiển thị QR code live từ `img.vietqr.io`
- Quản lý giá bài thi **per-exam** — ghi trực tiếp vào `exams.required_amount` (KHÔNG có bảng giá tập trung/jsonb riêng)

### PaymentHistoryPage (`/payments`)
- File: `src/pages/PaymentHistoryPage.jsx`
- Lịch sử giao dịch của user — đọc từ bảng `purchases` (status: PENDING/PARTIAL/SUCCESS/FAILED), qua Edge Function `manage-purchase`
- Hỗ trợ thanh toán một phần: badge "Một phần" hiển thị `paid_amount`/`required_amount`
- Hủy giao dịch (PENDING/PARTIAL): `CancelSheet` gọi `manage-purchase` action `cancel`

### StudentProgressPage (`/teacher/students/:studentId`) — Teacher only
- File: `src/pages/StudentProgressPage.jsx`
- Xem chi tiết tiến độ của một student
- **Xoá lịch sử làm bài** (thêm 2026-07-13): nút "Xoá lịch sử làm bài" cạnh tên student → `ConfirmDialog` nêu rõ tài khoản được giữ nguyên, chỉ xoá `exam_attempts` (action `clear-attempts`) → remount `AttemptHistoryTable` (đổi `key`) để load lại danh sách rỗng
- `AttemptHistoryTable` truyền `canDelete` (luôn bật, trang teacher-only) → mỗi dòng lịch sử cũng có nút xoá riêng lẻ (xem COMPONENTS.md)

## Redirect Logic

- `/` → `LandingPage` nếu chưa đăng nhập, `/dashboard` nếu đã đăng nhập (qua `RootRoute`)
- `*` (unknown) → `/dashboard` (rồi `ProtectedRoute` tự bounce `/login` nếu chưa đăng nhập)
- Unauthenticated trên route protected → `/login`
- Student truy cập teacher-only → `/dashboard`
