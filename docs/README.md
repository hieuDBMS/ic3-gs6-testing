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

## File Sizes (complexity reference)

| File | Lines |
|---|---|
| `src/pages/FlashcardPage.jsx` | 1127 |
| `src/pages/StudentManagementPage.jsx` | 948 |
| `src/components/questions/QuestionModal.jsx` | 866 (deprecated) |
| `src/pages/ExamPage.jsx` | 821 |
| `src/pages/QuestionsPage.jsx` | 751 |
| `src/pages/MockExamPage.jsx` | 688 |
| `src/components/exam/QuestionRenderer.jsx` | 657 |
| `src/pages/QuestionFormPage.jsx` | 602 |
| `src/pages/ExamStructurePage.jsx` | 573 |
| `src/pages/ResultPage.jsx` | 539 |
