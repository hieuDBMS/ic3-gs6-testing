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

**Đã dùng tại:** `StudentManagementPage`, `QuestionsPage`, `ExamStructurePage`

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
