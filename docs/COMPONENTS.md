# IC3 Exam Platform — Components Reference

## Context

### AuthContext (`src/context/AuthContext.jsx`)
```jsx
// Provider
<AuthProvider>

// Hook
const { user, profile, loading, login, logout,
        isStudent, isTeacher, isAdminCreated, isSelfRegistered, accountSource } = useAuth();
```
- `login(usernameOrEmail, password)`: nếu không có '@' → convert thành `username@ic3fighter.local`
- `fetchProfile(userId)`: fetch từ `profiles` table
- Prevents app unmount on tab switch (userIdRef pattern)
- Renders children chỉ khi `!loading`

### ThemeContext (`src/context/ThemeContext.jsx`)
```jsx
const { theme, toggleTheme, isDark } = useTheme();
// theme: 'dark' | 'light'
// Lưu vào localStorage key 'theme'
// Mặc định: system preference
// Toggle: document.documentElement.classList.toggle('dark')
```

---

## Custom Hooks (`src/hooks/`)

### `useExamAttempts(userId, options)` — `hooks/useExamAttempts.js`
```js
const { attempts, totalCount, cheatCounts, loading, error, refetch } =
  useExamAttempts(userId, {
    status,          // string | string[]
    excludeStatus,   // string
    examType,        // 'testing' | 'gmetrix'
    dateFrom,        // 'YYYY-MM-DD'
    dateTo,          // 'YYYY-MM-DD'
    passFilter,      // 'pass' | 'fail'
    page,            // number (undefined = no pagination)
    pageSize,        // default 8
    withCheatCounts, // bool, default false
    enabled,         // bool, default true
  });

refetch(silent = false); // silent=true giữ nguyên data cũ trong lúc fetch lại
                          // (không set loading=true → không flash skeleton),
                          // dùng sau khi xoá 1 attempt (xem AttemptHistoryTable)
```
Dùng tại: `DashboardPage`, `AttemptHistoryTable`

### `useExamStructure()` — `hooks/useExamStructure.js`
```js
const { levels, exams, loading, refetch } = useExamStructure();
// Cache trong sessionStorage 5 phút (key: 'examStructure_cache')
// refetch(force=true) để invalidate cache sau khi mutate
```
Dùng tại: `ExamListPage`, `QuestionFormPage`, `QuestionsPage`, `ExamStructurePage`

### `useQuestions(filters, pagination, enabled)` — `hooks/useQuestions.js`
```js
const { questions, totalCount, loading, error, refetch } = useQuestions(
  { examIds, questionType, search, orderExact, orderFrom, orderTo },
  { page, pageSize, sortColumn, ascending }
);
// examIds: null=no restriction, []=force empty, [...]=filter
```
Dùng tại: `QuestionsPage`

### `useMediaQuery(query)` — `hooks/useMediaQuery.js`
```js
const isDesktop = useMediaQuery('(min-width: 640px)');
```
Dùng tại `PaymentHistoryPage` để **chỉ mount 1 trong 2** `PurchaseRow`(table)/`PurchaseCard`(mobile) thay vì mount cả 2 rồi CSS-hide (`hidden sm:block`/`sm:hidden`) — mỗi row/card không-SUCCESS tự mở 1 realtime channel (`row:${id}`/`card:${id}`), mount cả 2 layout sẽ nhân đôi số channel khi có nhiều purchase đang chờ cùng lúc (đầu kỳ cả lớp thanh toán).

### `useStudents(options)` — `hooks/useStudents.js`
```js
const { students, totalCount, loading, error, refetch } = useStudents({
  search, page, pageSize
});
```
Dùng tại: `StudentManagementPage`, `StudentOverviewTable`
- Attempt stats (`totalAttempts`/`avgScore`/`lastActiveAt`) fetch qua RPC `get_student_attempt_stats()` (aggregate server-side, 1 dòng/học sinh có attempt) — **không** fetch raw `exam_attempts` nữa (trước 2026-07-13 fetch toàn bộ bảng, phình vô hạn theo lịch sử làm bài tích luỹ, không liên quan số học sinh đang xem trang).

---

## Shared Components (`src/components/shared/`)

### Toast (`Toast.jsx`) + `useToast()` hook
```jsx
// Hook
const { toasts, showToast, dismissToast } = useToast();
// showToast(message, type) — type: 'success' | 'error' | 'warning' | 'info'
// Auto-dismiss sau 3.5s

// Component
<Toast toasts={toasts} onDismiss={dismissToast} />
// Fixed bottom-right, dark mode support
```
Dùng tại: `StudentManagementPage`, `QuestionsPage`, `QuestionFormPage`, `PaymentHistoryPage`, `ExamStructurePage`

### ConfirmDialog (`ConfirmDialog.jsx`)
```jsx
<ConfirmDialog
  open={bool}
  title="Xoá học sinh"
  message="Toàn bộ lịch sử sẽ bị xoá..."
  confirmLabel="Xoá"    // default
  cancelLabel="Huỷ"     // default
  danger={true}          // default — red confirm button
  loading={bool}
  onConfirm={fn}
  onCancel={fn}
/>
```
Dùng tại: `StudentManagementPage`, `QuestionsPage`, `ExamStructurePage`

### EmptyState (`EmptyState.jsx`)
```jsx
<EmptyState
  icon={BookOpen}           // Lucide icon component
  title="Chưa có câu hỏi"
  description="Hãy thêm câu hỏi đầu tiên..."
  action={<Button>Thêm</Button>}  // optional
/>
```
Dùng tại: `StudentManagementPage`, `ResultPage`, `QuestionStatsPage`, `QuestionsPage`, `PaymentSettingsPage`, `LiveMonitorPage`, `ExamStructurePage`

### PageHeader (`PageHeader.jsx`)
```jsx
<PageHeader
  icon={TrendingDown}
  title="Câu hỏi hay sai nhất"
  description="Thống kê tỉ lệ trả lời sai..."
  actions={<button>Export</button>}  // optional
/>
```
Dùng tại: `QuestionStatsPage`, `LiveMonitorPage`, `AnalyticsPage`

### Skeleton (`Skeleton.jsx`)
```jsx
<Skeleton variant="card" />        // rounded block
<Skeleton variant="table-row" />   // wide row
<Skeleton variant="text" />        // narrow line
<Skeleton variant="circle" />      // avatar circle
// All use animate-pulse, dark mode support
```

### Navbar (`Navbar.jsx`) — 358 lines
- Desktop: NavLink (active indicator), TeacherDropdown
- Mobile: hamburger → slide-in
- Dark mode toggle button
- Avatar: initials hash-color từ `full_name`
- **Lưu ý**: KHÔNG render trong fullscreen exam (Navbar là sibling của exam container)
- **`data-nav-guard="true"`** trên cả 2 nút Đăng xuất (desktop + mobile drawer): đánh dấu để ExamPage/MockExamPage's navigate-away guard bắt được click, vì nút này là `<button onClick={handleLogout}>` chứ không phải `<a href>` — click-intercept theo href sẽ bỏ sót nếu không có marker này. Xem "Navigate-away guard" trong ROUTES_AND_PAGES.md → ExamPage.

### ProtectedRoute (`ProtectedRoute.jsx`)
```jsx
<ProtectedRoute allowedRoles={['teacher']} />
// undefined = any authenticated user
// Redirects: unauthenticated→/login, wrong role→/dashboard
```

### ImageLightbox (`ImageLightbox.jsx`)
```jsx
<ZoomableImage src={url} alt="" className="..." />
// Click → full-screen lightbox modal
```

### PaymentModal (`PaymentModal.jsx`)
```jsx
<PaymentModal exam={{ id, title, required_amount }} onClose={fn} onSuccess={fn} />
```
- Hiển thị QR code VietQR (`img.vietqr.io`) để mua bài thi, hỗ trợ thanh toán một phần (PARTIAL)
- Bank info fetch từ bảng `payment_config` (singleton id=1) — **cached ở module-level** (`_configCache`), chỉ fetch 1 lần/session, dedupe concurrent calls qua `_configFetching`
- Vòng đời `purchase` (bảng `purchases`) hoàn toàn qua Edge Function `manage-purchase`: `status` (check đã có purchase chưa) → `create` (nếu chưa) → hiển thị QR (phase `ready`)
- **Realtime**: subscribe `postgres_changes` UPDATE trên `purchases` filter theo `id=eq.${purchase.id}` → tự chuyển phase `success` khi `status` đổi thành `SUCCESS` (không cần polling)
- Phases: `init` → `ready` (hoặc `success` nếu đã thanh toán trước đó) → `error` (retry)

---

## Exam Components (`src/components/exam/`)

### QuestionRenderer (`QuestionRenderer.jsx`) — 657 lines
```jsx
<QuestionRenderer
  question={currentQ}
  userAnswer={answers[currentQ.id]}
  onChange={handleAnswerChange}
/>
```
**Sub-components:** `AnswerOption`, `DragItemCard`, `DropZoneColumn`, `DragDropQuestion`, `TrueFalseQuestion`, `HotspotQuestion`

**DragDrop state:** `answers[q.id] = { pairId: dropContent, ... }`
**TrueFalse state:** `answers[q.id] = { statementId: true|false, ... }`
**Content rendering:** `dangerouslySetInnerHTML={{ __html: content }}`

### Timer (`Timer.jsx`)
```jsx
<Timer
  ref={timerRef}              // expose getTimeLeft()
  durationSeconds={exam.duration_seconds}
  onExpire={() => doSubmit(true)}
/>
// Color: xanh → vàng (≤60s) → đỏ (≤30s)
```

### QuestionNavigator (`QuestionNavigator.jsx`)
```jsx
<QuestionNavigator
  questions={questions}
  currentIndex={currentIndex}
  answers={answers}
  flagged={flagged}
  onSelect={(index) => setCurrentIndex(index)}
/>
// Gray=chưa làm, indigo=đã làm, amber=flagged
```

---

## Question Components (`src/components/questions/`)

> `QuestionModal.jsx` (866 dòng, deprecated) đã bị xoá 2026-07-14 — QuestionsPage dùng route
> `/questions/new` / `/questions/:id/edit` (`QuestionFormPage`) từ trước, component này không
> còn nơi nào import.

### AnswerEditor (`AnswerEditor.jsx`)
```jsx
<AnswerEditor answers={answers} onChange={setAnswers} multiSelect={boolean} />
// Nút xoá đáp án tự disable khi còn ≤2 đáp án (tối thiểu bắt buộc lúc validate)
```

### ImageUploader (`ImageUploader.jsx`)
```jsx
<ImageUploader bucket="question-images|answer-images" value={url} onChange={fn} />
// Accept: jpg/jpeg/png/gif/webp, max 5MB, rename→UUID
```

### HotspotEditor (`HotspotEditor.jsx`) — 22894 bytes
```jsx
<HotspotEditor imageUrl={url} regions={regions} onChange={setRegions} multi={bool} />
```

### RichTextEditor (`RichTextEditor.jsx`)
- Toolbar: Bold, Italic, Underline, sub/sup — Output: HTML string

---

## Dashboard Components (`src/components/dashboard/`)

### AttemptHistoryTable (`AttemptHistoryTable.jsx`) — uses `useExamAttempts(studentId, { ... })`
```jsx
<AttemptHistoryTable studentId={uuid} showCheatFlags={bool} canDelete={bool} />
```
- `showCheatFlags`: hiện badge số lần gian lận trên mỗi dòng (teacher-only context, dùng ở `StudentProgressPage`)
- `canDelete` (mặc định `false`, thêm 2026-07-13): hiện nút xoá (Trash2) trên mỗi dòng, hover mới lộ ra cùng nút "Xem kết quả". Bấm → `ConfirmDialog` → gọi Edge Function `manage-student` action `delete-attempt` → `refetch(true)` (silent, không flash skeleton). Nếu xoá dòng cuối cùng của 1 trang > trang đầu → lùi về trang trước thay vì gọi `refetch` (tự trigger fetch bình thường cho trang mới) — tránh để `page` trỏ quá trang cuối. Chỉ set `true` khi người xem là teacher: `DashboardPage` truyền `canDelete={isTeacher}`, `StudentProgressPage` luôn truyền `canDelete` (trang teacher-only).
### StudentOverviewTable — uses `useStudents({ search, page, pageSize })`

---

## Analytics Components (`src/components/analytics/`)

### ScoreDistributionChart — SVG bar chart, data: `[{ range, count }]`
### GroupBreakdownChart — SVG horizontal bar chart

---

## Utils (`src/utils/`)

| File | Exports |
|---|---|
| `errorHandler.js` | `getErrorMessage(error)`, `logAndGetMessage(err, context)` |
| `avatar.js` | `getInitials(name)` |
| `certificate.js` | `generateCertificatePdf({ studentName, examLabel, scorePct, dateLabel, attemptId })` |
| `format.js` | `formatDurationLabel(seconds)` |
| `scoreUtils.js` | `isPassed(score)` (threshold=70), `PASS_THRESHOLD` |
| `text.js` | `stripHtml(html)` |
| `questionImport.js` | `parseCsvText(text)`, `parseWorkbookFile(arrayBuffer)`, `validateRows(...)` |
