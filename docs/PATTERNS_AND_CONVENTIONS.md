# IC3 Exam Platform — Patterns & Conventions

> Cập nhật sau Phase 1–4 refactor. Tất cả patterns dưới đây là **hiện trạng thực tế** trong source.

---

## 1. Authentication Pattern

```js
// AuthContext.login():
const email = usernameOrEmail.includes('@')
  ? usernameOrEmail
  : `${usernameOrEmail.toLowerCase()}@ic3fighter.local`;
supabase.auth.signInWithPassword({ email, password })
```

Prevent app remount on tab switch:
```js
const userIdRef = useRef(null);
if (userIdRef.current !== session.user.id) {
  // New user → full reload (setLoading true)
} else {
  // Same user (tab switch / token refresh) → silent profile refresh
}
```

---

## 2. Route Protection Pattern

```jsx
<Route element={<ProtectedRoute />}>              // any authenticated
  <Route path="/dashboard" element={<DashboardPage />} />
</Route>
<Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
  <Route path="/questions" element={<QuestionsPage />} />
</Route>
```

---

## 3. Lazy Loading Pattern

```js
// App.jsx — ALL pages are lazy-loaded
// Named export → rewrap as default (required by React.lazy)
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage }))
);
```

---

## 4. Toast Pattern (STANDARDIZED — dùng pattern này khắp nơi)

```jsx
import { Toast, useToast } from '../components/shared/Toast';

const { toasts, showToast, dismissToast } = useToast();

showToast('Lưu thành công!', 'success');  // 'success' | 'error' | 'warning' | 'info'
showToast(getErrorMessage(err), 'error'); // kết hợp với errorHandler

// Render (bottom of JSX return):
<Toast toasts={toasts} onDismiss={dismissToast} />
// Fixed bottom-right, auto-dismiss 3.5s, stacks multiple toasts
```

**Đã áp dụng tại:** `StudentManagementPage`, `QuestionsPage`, `QuestionFormPage`, `PaymentHistoryPage`, `ExamStructurePage`

---

## 5. Error Handling Pattern (STANDARDIZED — dùng errorHandler.js)

```js
import { getErrorMessage } from '../utils/errorHandler';

catch (err) {
  showToast(getErrorMessage(err), 'error'); // hoặc setError(getErrorMessage(err))
}

// getErrorMessage maps Postgres codes → Vietnamese:
// PGRST116 → 'Không tìm thấy dữ liệu'
// 23505    → 'Dữ liệu đã tồn tại (trùng lặp)'
// 23503    → 'Không thể xoá — dữ liệu đang được tham chiếu'
// 23502    → 'Thiếu thông tin bắt buộc'
// 42501    → 'Bạn không có quyền thực hiện thao tác này'
// PGRST301 → 'Phiên đăng nhập đã hết hạn...'
// Auth/network errors mapped bằng string-match
// Fallback: error.message || 'Đã có lỗi xảy ra. Vui lòng thử lại'
```

---

## 6. Custom Hooks Pattern (Phase 1 — dùng hooks thay inline fetch)

```js
// ✅ Dùng hooks — data logic tập trung, không lặp:
const { attempts, totalCount, cheatCounts, loading, refetch } =
  useExamAttempts(userId, { page, pageSize, excludeStatus, passFilter, ... });

const { levels, exams, loading, refetch } = useExamStructure();
// ↑ Cached 5 phút trong sessionStorage, refetch(force) để invalidate

const { questions, totalCount, loading, refetch } =
  useQuestions({ examIds, questionType, search }, { page, pageSize, sortColumn });

const { students, rawStudents, totalCount, loading, refetch } =
  useStudents({ search, activityFilter, schoolFilter, classFilter, page, pageSize });
// ↑ Fetch 1 lần, filter/sort/paginate client-side

// ❌ Tránh inline fetch trực tiếp trong component (trừ one-off, page-specific):
// useEffect(() => { supabase.from('exam_levels')... }, [])  ← move to hook
```

---

## 7. Supabase Data Fetching Pattern

```js
// Basic
const { data, error } = await supabase
  .from('table').select('col1, col2, related(col)')
  .eq('field', value).order('created_at', { ascending: false });

// Parallel (tránh N+1)
const [{ data: levels }, { data: exams }] = await Promise.all([
  supabase.from('exam_levels').select('*').order('version'),
  supabase.from('exams').select('*').order('exam_number'),
]);

// Pagination server-side (với count)
supabase.from('questions').select('...', { count: 'exact' }).range(from, to)

// Edge Function
const { data, error } = await supabase.functions.invoke('manage-student', {
  body: { action: 'create', ...params },
});

// RPC
const { data, error } = await supabase.rpc('submit_exam_attempt', { p_attempt_id, ... });
```

---

## 8. React.memo Pattern (Phase 3 — đã áp dụng)

```js
// Pattern: đặt tên impl, wrap bằng memo khi export
const QuestionRendererImpl = ({ question, userAnswer, onChange }) => { ... };
export const QuestionRenderer = React.memo(QuestionRendererImpl);

// Đã wrap bằng React.memo:
// - QuestionRenderer   (src/components/exam/QuestionRenderer.jsx:658)
// - QuestionNavigator  (src/components/exam/QuestionNavigator.jsx:132)
// - AttemptHistoryTable (src/components/dashboard/AttemptHistoryTable.jsx:267)
// - StudentOverviewTable (src/components/dashboard/StudentOverviewTable.jsx:271)
```

---

## 9. useMemo / useCallback Pattern — ExamPage (Phase 3)

```js
// ExamPage.jsx — computed values (memoized, dòng 497-503)
const currentQ     = useMemo(() => questions[currentIndex], [questions, currentIndex]);
const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
const unanswered    = useMemo(() => questions.length - answeredCount, [questions.length, answeredCount]);
const progressPct   = useMemo(
  () => questions.length > 0 ? (answeredCount / questions.length) * 100 : 0,
  [questions.length, answeredCount]
);

// Handlers (useCallback)
const handleAnswerChange = useCallback((val) => { ... }, [questions, currentIndex]);
const toggleFlag         = useCallback(() => { ... }, [questions, currentIndex]);
const doSubmit           = useCallback(async (isAutoSubmit) => { ... }, [answers, attemptId, questions, navigate, exam]);
const logCheatEvent      = useCallback((eventType) => { ... }, [attemptId, user]);
```

---

## 10. ExamPage Live Ping (throttled 4s + AbortController)

```js
// ExamPage.jsx dòng 325-339
useEffect(() => {
  if (!attemptId) return;
  const now = Date.now();
  if (now - lastPingRef.current < 4000) return;  // throttle
  lastPingRef.current = now;
  const controller = new AbortController();
  supabase.from('exam_attempts')
    .update({ current_question_index: currentIndex, last_activity_at: new Date().toISOString() })
    .eq('id', attemptId)
    .abortSignal(controller.signal)
    .then(() => {}).catch(() => {});
  return () => controller.abort();  // cleanup on unmount / re-fire
}, [currentIndex, attemptId]);
```

---

## 11. ExamPage Submit Pattern (double-submit guard)

```js
const isSubmittingRef = useRef(false);

const doSubmit = useCallback(async (isAutoSubmit = false) => {
  if (isSubmittingRef.current) return;  // ← Guard double-submit
  isSubmittingRef.current = true;
  setSubmitting(true);
  setShowConfirm(false);

  // Prepare answers by type:
  // p_answers    { qId: [answerId, ...] }  — choice/multi/hotspot
  // p_tf_answers { qId: { stmtId: bool } } — truefalse
  // p_dd_answers { qId: { pairId: drop } } — dragdrop

  await supabase.rpc('submit_exam_attempt', { p_attempt_id, p_time_spent, ... });
  navigate(`/exam/${attemptId}/result`);
}, [answers, attemptId, questions, navigate, exam]);
```

---

## 12. ConfirmDialog Pattern

```jsx
import { ConfirmDialog } from '../components/shared/ConfirmDialog';

const [confirmState, setConfirmState] = useState({ open: false, item: null, loading: false });

// Trigger:
setConfirmState({ open: true, item: row, loading: false });

// Handler:
const handleConfirm = async () => {
  setConfirmState(s => ({ ...s, loading: true }));
  try {
    await deleteItem(confirmState.item.id);
    showToast('Xoá thành công', 'success');
    setConfirmState({ open: false, item: null, loading: false });
    refetch();
  } catch (err) {
    showToast(getErrorMessage(err), 'error');
    setConfirmState(s => ({ ...s, loading: false }));
  }
};

<ConfirmDialog
  open={confirmState.open}
  title="Xoá câu hỏi?"
  message={`Xoá "${confirmState.item?.content}"?`}
  danger loading={confirmState.loading}
  onConfirm={handleConfirm}
  onCancel={() => setConfirmState({ open: false, item: null, loading: false })}
/>
```

**Đã dùng tại:** `StudentManagementPage`, `QuestionsPage`, `ExamStructurePage`, `AttemptHistoryTable`, `StudentProgressPage`, `DashboardPage` (thêm 2026-07-13 — xoá lịch sử làm bài, xem PROJECT_OVERVIEW.md → Edge Functions → `manage-student`)

**Refinement — silent refetch cho action tần suất cao (thêm 2026-07-13):** `refetch()` mặc định set `loading=true` → component nào render skeleton toàn bộ khi `loading` (như `AttemptHistoryTable`) sẽ flash cả danh sách chỉ để xoá 1 dòng. Với action xoá **1 item lẻ** trong 1 danh sách dài (khác với xoá cả danh sách/1 entity lớn — những case đó flash skeleton là chấp nhận được), truyền `refetch(true)` (silent — giữ nguyên data cũ trong lúc fetch ngầm, không flash skeleton). Cần hook hỗ trợ tham số `silent` trong hàm fetch nội bộ (xem `useExamAttempts`, cùng pattern với `PaymentHistoryPage`'s `fetchPurchases(silent)`).

---

## 13. Session Storage Persistence (QuestionsPage)

```js
const SS_KEY = 'questionsPage_state';
const [filters, setFilters] = useState(saved?.filters ?? DEFAULT_FILTERS);
useEffect(() => saveState({ filters, sortOption, page }), [filters, sortOption, page]);
// Restore filters/sort/page khi back browser về trang
```

---

## 14. ExamStructure Cache Pattern (useExamStructure)

```js
const SS_KEY = 'examStructure_cache';
const CACHE_TTL_MS = 5 * 60 * 1000;  // 5 phút

// On mount: read cache → if valid, skip fetch
// refetch(force=true) để invalidate sau khi mutate exam_levels/exams
const { levels, exams, loading, refetch } = useExamStructure();
```

---

## 15. Realtime Pattern (LiveMonitorPage)

```js
const channel = supabase
  .channel('exam-monitor')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_attempts' }, scheduleRefetch)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'exam_cheat_events' }, scheduleRefetch)
  .subscribe();
return () => { supabase.removeChannel(channel); };
// scheduleRefetch: debounce 500ms để tránh refetch liên tiếp
```

**maxWait ceiling (2026-07-13)**: `scheduleRefetch` là debounce thuần trailing-edge trước đây — với lớp đông (30+ học sinh ping mỗi 4s độc lập), tổng tần suất event trên channel `exam-monitor` có thể liên tục reset timer, khiến `fetchLive()` không bao giờ chạy đúng lúc hoạt động cao nhất. Đã thêm `maxWaitRef` (1500ms) song song `debounceRef` (500ms) trong `LiveMonitorPage.jsx` — refetch đảm bảo chạy tối đa mỗi 1.5s dù channel liên tục nhận event. Query `fetchLive()` cũng đã thêm `.limit(300)` làm trần an toàn (trước đó không giới hạn, tải tăng tuyến tính theo tổng số attempt `in_progress` toàn hệ thống).

---

## 16. Anti-Cheat Pattern (ExamPage only — không có trong MockExamPage)

```js
// De-dupe double-fires với 2s throttle
const logCheatEvent = useCallback((eventType) => {
  if (!attemptId || isSubmittingRef.current) return;
  const now = Date.now();
  if (now - lastCheatLogRef.current < 2000) return;
  lastCheatLogRef.current = now;
  supabase.from('exam_cheat_events').insert({ attempt_id, user_id, event_type });
  setCheatToast('Đã phát hiện bạn rời khỏi bài thi — hành vi này được ghi lại.');
}, [attemptId, user]);

// Triggers: visibilitychange → 'tab_switch'
// Fullscreen exit → 'fullscreen_exit' (chỉ unexpected — không log khi dùng Minimize button)
// manualExitRef.current = true khi click Minimize → ngăn log
```

---

## 17. Dark Mode Pattern

```jsx
className="bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"

// Inline style (dùng khi Tailwind không đủ):
const { isDark } = useTheme();
style={{ background: isDark ? '#1e293b' : '#ffffff' }}
```

---

## 18. Avatar / Color Pattern

```js
const COLORS = ['from-indigo-500 to-violet-600', 'from-emerald-500 to-teal-600', ...];
const getColor = (s) => {
  let h = 0;
  for (const c of s || '') h = c.charCodeAt(0) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
};
// className: `bg-gradient-to-br ${getColor(name)} text-white rounded-full`
```

---

## 19. Self-Registered Access Control

```js
const { isSelfRegistered } = useAuth();
useEffect(() => {
  if (!isSelfRegistered || !user || !examId) return;
  supabase.rpc('user_can_access_exam', { p_user_id: user.id, p_exam_id: examId })
    .then(({ data: canAccess }) => {
      if (!canAccess) navigate('/exam', { replace: true, state: { toast: 'Bạn chưa mua bài thi này.' } });
    });
}, [isSelfRegistered, user, examId]);
```

---

## 20. VietQR Integration

```js
const url = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png`
  + `?amount=${amount}&addInfo=IC3Fighter&accountName=${encodeURIComponent(accountName)}`;
```

---

## 21. Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Component files | PascalCase.jsx | `QuestionRenderer.jsx` |
| Hook files | camelCase.js | `useExamAttempts.js` |
| Utility files | camelCase.js | `errorHandler.js` |
| CSS classes | Tailwind utility | `bg-indigo-600` |
| DB fields | snake_case | `order_index`, `is_correct` |
| React state | camelCase | `currentIndex`, `answeredCount` |
| Constants | UPPER_SNAKE | `PAGE_SIZE`, `PASS_THRESHOLD` |
| Page exports | Named const arrow | `export const QuestionsPage = () =>` |
| Component exports | Named const arrow | `export const ConfirmDialog = () =>` |
| Default export | App.jsx only | `export default App` |
| RPC params | p_ prefix | `p_attempt_id`, `p_is_auto` |
| Hook options | camelCase | `withCheatCounts`, `excludeStatus` |
| Memo impl name | *Impl suffix | `QuestionRendererImpl` |

---

## 22. Resume Session Pattern (ExamPage)

```js
// initExam(), TRƯỚC khi insert attempt mới:
const { data: existing } = await supabase
  .from('exam_attempts')
  .select('id, started_at, current_question_index')
  .eq('user_id', user.id).eq('exam_id', examId)
  .eq('status', 'in_progress').eq('is_mock', false)
  .order('started_at', { ascending: false })
  .limit(1).maybeSingle();   // ← maybeSingle(), KHÔNG single() — có thể 0 row

if (existing) setExistingAttempt(existing);  // render chặn bằng ResumeModal, chưa insert gì
else { /* insert attempt mới như cũ */ }

// Resume: dùng lại attempt cũ, khôi phục CẢ vị trí câu hỏi lẫn answers/flagged
// (từ cột draft_answers jsonb, xem bên dưới) + đồng hồ tính đúng thời gian còn
// lại (dựa trên started_at, xem Timer startedAt prop)
// Restart: update attempt cũ status='auto_submitted' rồi insert mới
```
Mục đích: chặn tạo trùng `exam_attempts` (nhiều card trùng học sinh trên LiveMonitorPage) khi học sinh tắt tab/đổi route giữa chừng rồi quay lại đúng bài thi đó.

**Lưu draft answers (thêm 2026-07-13)**: `exam_attempts.draft_answers` (jsonb, xem `supabase/sql/2026-07-13_exam_draft_answers.sql`) lưu `{ answers, flagged }` — ghi kèm trong cùng ping throttle-4s vốn đã update `current_question_index`/`last_activity_at` (`ExamPage.jsx`), không tạo luồng ghi riêng. Khi resume, hydrate `answers`/`flagged` từ cột này thay vì bắt đầu trắng. `doSubmit()` không đổi — vẫn chấm điểm từ `answers` state trong bộ nhớ, `draft_answers` chỉ là lớp phục hồi.

**Đồng hồ đếm giờ đúng khi resume**: `Timer.jsx` nhận thêm prop `startedAt` (ISO string từ `exam_attempts.started_at`), tính `timeLeft` ban đầu = `durationSeconds - elapsed(startedAt)` thay vì luôn full duration — tránh học sinh "làm mới" thời gian bằng cách đóng tab rồi vào lại.

**MockExamPage cũng áp dụng pattern lưu draft_answers + đồng hồ đúng** (khác `ExamPage`: không có ResumeModal chọn Tiếp tục/Làm lại vì `attemptId` cố định từ URL — không có nguy cơ trùng row — nên tự động resume ngay khi `initExam()` load lại đúng attempt đang `in_progress`). Do không có modal, MockExamPage không có bước cảnh báo hết giờ như ExamPage bên dưới — nếu attempt đã hết giờ từ lâu, vào lại sẽ tự nộp ngay lập tức không báo trước.

**ResumeModal cảnh báo khi attempt đã hết giờ**: `isExpired` = `elapsedSeconds >= exam.duration_seconds` (tính từ `existingAttempt.started_at`, so với hiện tại). Nếu true, đổi label nút "Tiếp tục làm bài" → "Nộp bài đã lưu" + hiện notice — vì Timer giờ tính đúng elapsed time (xem trên), bấm "Tiếp tục" trên 1 attempt đã hết giờ sẽ khiến `onTimeUp` fire ngay khi mount, tự nộp bài lập tức; tránh học sinh bị bất ngờ. Tính tại thời điểm 2026-07-13: ~219/220 attempt `in_progress` (thi thường) hiện có trên DB đã vượt quá duration — hầu hết học sinh có bài dở dang sẽ thấy trạng thái này.

**localStorage mirror (thêm 2026-07-14)**: `src/utils/examDraftStorage.js` ghi `{ answers, flagged, currentIndex }` vào `localStorage` (key `ic3_exam_draft_<attemptId>`) mỗi lần state đổi — **không throttle**, khác với ping Supabase 4s ở trên. Mục đích: ping 4s có thể chưa kịp gửi (mất mạng, đóng tab trong cửa sổ 4s) — bản local đồng bộ ngay lập tức nên luôn có bản mới nhất. Khi resume (`handleResumeAttempt`/`initExam` của `MockExamPage`), `mergeExamDraft()` merge draft server + local (local đè lên theo từng key, không mất dữ liệu của bên nào). Xoá draft local (`clearExamDraft`) khi: nộp bài thành công, nộp bài do `already_submitted`, và khi restart attempt (`handleRestartAttempt` xoá draft của attempt cũ). Đây là lớp phòng hộ bổ sung — nguồn sự thật vẫn là `exam_attempts.draft_answers` trên server, không thay thế.

---

## 23. Navigate-Away Guard Pattern (ExamPage, MockExamPage)

App dùng `<BrowserRouter>` (không phải `createBrowserRouter`) → **`useBlocker` không dùng được** (throw ngoài data router). Chặn thủ công bằng DOM interception thay vì migrate toàn bộ router:

```js
// 1. Click-intercept (capture phase) — bắt <a href> nội bộ VÀ [data-nav-guard]
//    (vd nút Đăng xuất trong Navbar — button, không phải anchor)
document.addEventListener('click', (e) => {
  if (isSubmittingRef.current || bypassNavGuardRef.current) return;
  const target = e.target.closest('a[href], [data-nav-guard]');
  if (!target) return;
  if (target.matches('a[href]')) {
    const href = target.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || target.target === '_blank') return;
  }
  e.preventDefault(); e.stopPropagation();
  pendingNavElRef.current = target;
  setShowNavigateAway(true);
}, true);

// 2. popstate sentinel — chặn nút Back trình duyệt
window.history.pushState(null, '', window.location.href);
window.addEventListener('popstate', () => {
  window.history.pushState(null, '', window.location.href); // neutralize
  setShowNavigateAway(true); // pendingNavElRef = null → fallback navigate('/dashboard')
});

// 3. Xác nhận "Rời khỏi" → re-dispatch CLICK GỐC (không tự đoán route)
const el = pendingNavElRef.current;
if (el) { bypassNavGuardRef.current = true; el.click(); setTimeout(() => bypassNavGuardRef.current = false, 0); }
else navigate('/dashboard'); // trường hợp popstate, không có element cụ thể
```
Re-dispatch click gốc (thay vì đoán path rồi gọi `navigate()`) đảm bảo hành vi đúng 100% dù target là Link (điều hướng thật) hay nút Đăng xuất (logout thật) — component không cần biết ngữ nghĩa của từng phần tử nó chặn.

**Không** auto-submit hay đổi `status` khi rời trang — dựa vào Resume Session Pattern (#22) + LiveMonitor zombie filter (#24) để xử lý phần còn lại.

---

## 24. LiveMonitor Zombie Filter Pattern (client-side tick, không polling)

```js
// LiveMonitorPage.jsx — chỉ dựa vào last_activity_at, KHÔNG dựa vào started_at/duration
// (resume session giữ nguyên started_at gốc — cutoff theo duration sẽ ẩn nhầm session đang sống)
const ACTIVITY_TIMEOUT_SECONDS = 60;

// Floor query — cùng ngưỡng với filter client, tránh fetch dữ liệu sẽ bị lọc ngay sau đó
.gte('last_activity_at', new Date(Date.now() - ACTIVITY_TIMEOUT_SECONDS * 1000).toISOString())

// Zombie tự ẩn KHÔNG cần network — attempts chỉ update qua Realtime event (write DB),
// nhưng 1 session zombie (đã rời đi) không còn tạo write nào để tự trigger refetch.
// Dựa vào `now` (state tick 1s có sẵn) để re-filter mỗi giây, độc lập với network:
const liveAttempts = useMemo(
  () => attempts.filter(a => now - new Date(a.last_activity_at || a.started_at).getTime() <= ACTIVITY_TIMEOUT_SECONDS * 1000),
  [attempts, now],
);
// Dùng liveAttempts (không phải attempts thô) cho mọi render: badge đếm, empty-state, pagination.
```
Đã verify bằng test thật: card biến mất chính xác ở giây thứ 60, **0 request mạng** phát sinh trong lúc chờ — hoàn toàn client-side.

---

## 25. i18n Pattern (react-i18next — toàn bộ app, VI/EN)

**Scope**: toàn bộ app dùng `t()` — public (LandingPage/Navbar/Login/Register) và toàn bộ trang đã đăng nhập (dashboard/exam/mock-exam/flashcard/payment/teacher tools). Ngoại lệ duy nhất: `src/components/questions/QuestionModal.jsx` — dead code, không import ở đâu, cố tình bỏ qua.

**Cấu trúc — mỗi feature area 1 cặp file JSON riêng** (để dịch song song/độc lập không đụng file chung, xem `src/i18n/index.js` merge tất cả lại bằng object spread thành 1 `translation` resource phẳng — **không** dùng cơ chế namespace thật của i18next, `t()` vẫn gọi không tiền tố như `t('dashboard.title')`):

| File | Top-level key(s) |
|---|---|
| `vi.json` / `en.json` | `common`, `nav`, `auth.login`, `auth.register`, `landing` |
| `vi.dashboard.json` / `en.dashboard.json` | `dashboard`, `attemptHistory`, `studentOverview`, `analytics`, `groupBreakdownChart`, `scoreDistributionChart`, `liveMonitor`, `questionStats` |
| `vi.exam.json` / `en.exam.json` | `exam`, `examList`, `result`, `questionRenderer`, `questionNavigator` |
| `vi.mockExam.json` / `en.mockExam.json` | `mockExam`, `mockExamSetup`, `mockResult`, `flashcardList`, `flashcard` |
| `vi.payment.json` / `en.payment.json` | `paymentHistory`, `paymentSettings`, `paymentModal` |
| `vi.teacherAdmin.json` / `en.teacherAdmin.json` | `questionsAdmin`, `questionForm`, `questionImport`, `hotspotEditor`, `imageUploader`, `studentManagement`, `studentProgress`, `examStructure` |

- `src/i18n/index.js` — khởi tạo `i18next` + `initReactI18next`, import + spread-merge tất cả 12 file JSON trên, đọc ngôn ngữ ban đầu từ `localStorage['ic3_lang']` (fallback `navigator.language`)
- `src/context/LanguageContext.jsx` — **cùng pattern với `ThemeContext.jsx`** (đọc localStorage lazy-init, `useEffect` persist + gọi `i18next.changeLanguage()`), export `useLanguage()` → `{ lang, toggleLanguage }`

**Dùng trong component**:
```jsx
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
t('nav.dashboard')                                    // string đơn giản
t('landing.footer.copyright', { year: 2026 })         // interpolation {{year}}
t('landing.features.items', { returnObjects: true })  // trả về array/object (cần returnObjects vì i18next mặc định chỉ trả string)
```

**Không dịch**: giá trị enum/status dùng trong logic so sánh (`status === 'in_progress'`, `'PENDING'`/`'SUCCESS'`/`'PARTIAL'`, question_type `'choice'`/`'multi'`/`'dragdrop'`/`'truefalse'`/`'hotspot'`, Edge Function `action` string...) — chỉ dịch LABEL hiển thị cho các giá trị đó, không đụng vào chính giá trị. Tên bảng/cột Supabase, RPC name, CSS class, route path, `sessionStorage`/`localStorage` key name cũng giữ nguyên.

**Thêm string mới vào page đã có sẵn**: thêm key vào **cả 2 file** (vi + en) của feature area tương ứng cùng lúc — thiếu 1 bên sẽ fallback về `fallbackLng: 'vi'` khi đang ở `en` (không crash, nhưng lộ tiếng Việt giữa trang tiếng Anh).

**Thêm 1 feature area mới hoàn toàn**: tạo `vi.<area>.json`/`en.<area>.json` mới, import + spread vào `resources` trong `src/i18n/index.js` (cả `vi` lẫn `en`), chọn top-level key mới không trùng với danh sách ở bảng trên.

**Ngôn ngữ mặc định**: `vi` (`fallbackLng`), vì phần lớn user hiện tại là tiếng Việt. Language switcher (icon `Globe`, cạnh nút dark-mode toggle) nằm ở `Navbar.jsx` (desktop + mobile drawer) và `LandingPage.jsx`'s nav riêng.
