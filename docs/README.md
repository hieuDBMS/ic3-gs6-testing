# IC3 Exam Platform — Documentation Index

Các file tài liệu này được viết để Claude AI có thể tra cứu source code hiệu quả, tiết kiệm token.

## Files

| File | Nội dung |
|---|---|
| [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) | Tech stack, cấu trúc thư mục, user roles, env vars, RPC/Edge Functions |
| [ROUTES_AND_PAGES.md](./ROUTES_AND_PAGES.md) | Toàn bộ routes, chi tiết từng page component |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Schema tất cả bảng DB, RLS policies, RPC functions |
| [COMPONENTS.md](./COMPONENTS.md) | Chi tiết components, hooks, props, usage patterns |
| [PATTERNS_AND_CONVENTIONS.md](./PATTERNS_AND_CONVENTIONS.md) | Code patterns, conventions, best practices |

## Quick Reference

| Cần gì | Đọc file nào |
|---|---|
| Luồng làm bài (ExamPage) | ROUTES_AND_PAGES.md → ExamPage |
| Schema bảng DB | DATABASE_SCHEMA.md |
| Dùng useToast | PATTERNS_AND_CONVENTIONS.md → Toast Pattern |
| Dùng getErrorMessage | PATTERNS_AND_CONVENTIONS.md → Error Handling |
| Dùng ConfirmDialog | PATTERNS_AND_CONVENTIONS.md → ConfirmDialog Pattern |
| Dùng hooks (useExamAttempts...) | COMPONENTS.md → Custom Hooks |
| Thêm route mới | ROUTES_AND_PAGES.md → Route Structure |
| Dark mode | PATTERNS_AND_CONVENTIONS.md → Dark Mode |
| Upload ảnh | COMPONENTS.md → ImageUploader |
| Schema bảng `purchases`/`payment_config`/mock exam | DATABASE_SCHEMA.md → Bẫy thường gặp (tên bảng/cột dễ nhầm) |
| Luồng mua bài / PaymentModal | COMPONENTS.md → PaymentModal, ROUTES_AND_PAGES.md → PaymentHistoryPage |
| Luồng thi thử (Mock Exam) | ROUTES_AND_PAGES.md → MockExamSetupPage/MockExamPage/MockResultPage |
| Học sinh thoát bài giữa chừng / trùng session | PATTERNS_AND_CONVENTIONS.md → #22 Resume Session, ROUTES_AND_PAGES.md → ExamPage |
| Chặn rời trang thi (logo/back/logout) | PATTERNS_AND_CONVENTIONS.md → #23 Navigate-Away Guard |
| LiveMonitorPage không hiện / hiện trùng / không tự ẩn | PATTERNS_AND_CONVENTIONS.md → #24 LiveMonitor Zombie Filter, ROUTES_AND_PAGES.md → LiveMonitorPage |
| Hiệu năng nhiều user đồng thời (index, RPC aggregate, realtime channel) | DATABASE_SCHEMA.md → Bẫy thường gặp + RPC mới (2026-07-13), `supabase/sql/2026-07-13_concurrency_indexes.sql`, COMPONENTS.md → useMediaQuery/useStudents |
| Xoá lịch sử làm bài (1 dòng / 1 student·teacher / toàn hệ thống), không đụng tài khoản | PROJECT_OVERVIEW.md → Edge Functions → `manage-student` (`delete-attempt`/`clear-attempts`/`clear-all-attempts`), ROUTES_AND_PAGES.md → StudentManagementPage/StudentProgressPage/DashboardPage, COMPONENTS.md → AttemptHistoryTable, DATABASE_SCHEMA.md → Bẫy thường gặp (không có RLS DELETE trên `exam_attempts`) |
| Streak luyện tập / bảng xếp hạng (Leaderboard) | ROUTES_AND_PAGES.md → DashboardPage (streak card)/LeaderboardPage, DATABASE_SCHEMA.md → `profiles` (4 cột streak) + Triggers + RPC `get_leaderboard`/`get_my_leaderboard_rank`/`set_leaderboard_opt_in`, COMPONENTS.md → `useLeaderboard`/`streak.js` |
| Anti-cheat (tab switch / thoát fullscreen) | PATTERNS_AND_CONVENTIONS.md → #16 Anti-Cheat (áp dụng cả ExamPage lẫn MockExamPage từ 2026-07-16) |

## Shared Infrastructure (đã có, dùng luôn không cần tạo mới)

### Hooks (`src/hooks/`)
- `useExamAttempts(userId, options)` — fetch exam_attempts với filter/pagination
- `useExamStructure()` — fetch levels+exams, cache sessionStorage 5 phút
- `useQuestions(filters, pagination)` — fetch questions với filter/sort/pagination
- `useStudents(options)` — fetch students với search/pagination
- `useLeaderboard(options)` / `useMyLeaderboardRank(options)` — bảng xếp hạng streak/số bài (opt-in), thêm 2026-07-15

### Shared Components (`src/components/shared/`)
- `Toast.jsx` + `useToast()` — toast notifications (bottom-right)
- `ConfirmDialog.jsx` — confirm dialog (danger/normal)
- `EmptyState.jsx` — "no data" placeholder
- `PageHeader.jsx` — teacher page header (icon + title + description + actions)
- `Skeleton.jsx` — loading skeleton (card/table-row/text/circle)

### Utils (`src/utils/`)
- `errorHandler.js` — `getErrorMessage(err)` maps Supabase error codes → Vietnamese
- `scoreUtils.js` — `isPassed(score)`, `PASS_THRESHOLD=70`
- `text.js` — `stripHtml(html)`
- `format.js` — `formatDurationLabel(seconds)`
- `avatar.js` — `getInitials(name)`
- `certificate.js` — `generateCertificatePdf(options)` (canvas → jsPDF)
- `streak.js` — `getEffectiveStreak(lastStreakDate, currentStreak)`, `isStreakAtRisk(...)` (thêm 2026-07-15)

## File Sizes (complexity reference, 2026-07-22)

> `QuestionModal.jsx` đã bị xoá 2026-07-14 (dead code, không còn import ở đâu) — không còn trong bảng này.

| File | Lines |
|---|---|
| `src/pages/FlashcardPage.jsx` | ~1225 (file lớn nhất) |
| `src/pages/ExamPage.jsx` | ~1200 |
| `src/pages/StudentManagementPage.jsx` | ~965 |
| `src/pages/MockExamPage.jsx` | ~945 |
| `src/pages/QuestionFormPage.jsx` | ~660 |
| `src/pages/QuestionsPage.jsx` | ~705 |
| `src/components/exam/QuestionRenderer.jsx` | ~670 |
| `src/pages/PaymentHistoryPage.jsx` | ~580 |
| `src/pages/ResultPage.jsx` | ~555 |
| `src/pages/ExamStructurePage.jsx` | ~540 |
| `src/components/shared/Navbar.jsx` | ~385 |

## Tests (`src/utils/*.test.js`)

Có test cho: `avatar.js`, `format.js`, `questionImport.js`, `scoreUtils.js`, `streak.js`, `text.js`. Không có test cho components/pages (chưa setup React Testing Library) — chỉ pure-function utils.
