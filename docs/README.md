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
| Anti-cheat | PATTERNS_AND_CONVENTIONS.md → Anti-Cheat |
| Schema bảng `purchases`/`payment_config`/mock exam | DATABASE_SCHEMA.md → Bẫy thường gặp (tên bảng/cột dễ nhầm) |
| Luồng mua bài / PaymentModal | COMPONENTS.md → PaymentModal, ROUTES_AND_PAGES.md → PaymentHistoryPage |
| Luồng thi thử (Mock Exam) | ROUTES_AND_PAGES.md → MockExamSetupPage/MockExamPage/MockResultPage |
| Học sinh thoát bài giữa chừng / trùng session | PATTERNS_AND_CONVENTIONS.md → #22 Resume Session, ROUTES_AND_PAGES.md → ExamPage |
| Chặn rời trang thi (logo/back/logout) | PATTERNS_AND_CONVENTIONS.md → #23 Navigate-Away Guard |
| LiveMonitorPage không hiện / hiện trùng / không tự ẩn | PATTERNS_AND_CONVENTIONS.md → #24 LiveMonitor Zombie Filter, ROUTES_AND_PAGES.md → LiveMonitorPage |

## Shared Infrastructure (đã có, dùng luôn không cần tạo mới)

### Hooks (`src/hooks/`)
- `useExamAttempts(userId, options)` — fetch exam_attempts với filter/pagination
- `useExamStructure()` — fetch levels+exams, cache sessionStorage 5 phút
- `useQuestions(filters, pagination)` — fetch questions với filter/sort/pagination
- `useStudents(options)` — fetch students với search/pagination

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

## File Sizes (complexity reference, 2026-07-10)

| File | Lines |
|---|---|
| `src/pages/FlashcardPage.jsx` | 1137 |
| `src/pages/ExamPage.jsx` | 1089 |
| `src/pages/StudentManagementPage.jsx` | 844 |
| `src/components/questions/QuestionModal.jsx` | 865 (deprecated) |
| `src/pages/MockExamPage.jsx` | 801 |
| `src/pages/QuestionsPage.jsx` | 702 |
| `src/components/exam/QuestionRenderer.jsx` | 658 |
| `src/pages/PaymentHistoryPage.jsx` | 570 |
| `src/pages/QuestionFormPage.jsx` | 583 |
| `src/pages/ExamStructurePage.jsx` | 516 |
| `src/pages/ResultPage.jsx` | 538 |
| `src/components/shared/Navbar.jsx` | 358 |

## Tests (`src/utils/*.test.js`)

Có test cho: `avatar.js`, `format.js`, `questionImport.js`, `scoreUtils.js`. Không có test cho components/pages (chưa setup React Testing Library) — chỉ pure-function utils.
