# IC3 Exam Platform — Project Overview

## Tổng quan

Nền tảng thi trực tuyến IC3 (Internet and Computing Core Certification) xây dựng bằng **ReactJS 19 + Vite + Supabase**.

- **Repository**: `c:\TinHoc\Cap2\Testing4`
- **Dev server**: `npm run dev` → http://localhost:5173
- **Deploy**: Vercel (xem `vercel.json`) — SPA rewrite toàn bộ về `/`, security headers (CSP/HSTS/...) trên mọi route, `Cache-Control: immutable` riêng cho `/assets/*` và file tĩnh (svg/png/font — thêm 2026-07-13) vì Vite build ra tên file có hash, an toàn cache vĩnh viễn; `index.html` không match rule này nên vẫn theo default revalidate của Vercel

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19.x + Vite 8.x (Rolldown/Oxc) |
| Styling | Tailwind CSS v4.x (`@tailwindcss/postcss`, CSS-first `@theme` config in `src/index.css`, no `tailwind.config.js`) |
| Backend / DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Storage | Supabase Storage (`question-images`, `answer-images`) |
| State | React Context API (AuthContext, ThemeContext, LanguageContext) |
| Server state | TanStack Query (`@tanstack/react-query`) — dùng trong `useExamAttempts`/`useStudents`, cache/refetch/dedupe thay vì tự quản lý bằng `useState`/`useEffect`. Thêm 2026-07-14 |
| Forms | React Hook Form + Zod (`@hookform/resolvers/zod`) — reference implementation: form tạo student trong `StudentManagementPage.jsx`. Các form khác vẫn dùng `useState` thủ công (chưa migrate). Thêm 2026-07-14 |
| Routing | React Router v7 |
| Icons | Lucide React |
| PDF | jsPDF (certificate) |
| Excel | ExcelJS (import câu hỏi) |
| i18n | react-i18next — toàn bộ app, VI/EN (xem PATTERNS_AND_CONVENTIONS.md → i18n Pattern) |
| Error tracking | Sentry (`@sentry/react`, `src/lib/sentry.js`) — no-op nếu thiếu `VITE_SENTRY_DSN`. Thêm 2026-07-14 |
| CAPTCHA | Cloudflare Turnstile (`src/components/shared/Turnstile.jsx`) trên `/register` — no-op nếu thiếu `VITE_TURNSTILE_SITE_KEY`/`TURNSTILE_SECRET_KEY`. Thêm 2026-07-14 |

## Cấu trúc thư mục chính

```
src/
├── App.jsx                  # Router + lazy-load tất cả pages
├── main.jsx                 # Entry point
├── context/
│   ├── AuthContext.jsx      # Auth state, login/logout, profile
│   └── ThemeContext.jsx     # Dark/light mode toggle
├── lib/
│   └── supabase.js          # Supabase client singleton
├── pages/                   # 24 page components (lazy-loaded)
├── components/
│   ├── shared/              # Navbar, ProtectedRoute, ImageLightbox, PaymentModal
│   ├── exam/                # Timer, QuestionNavigator, QuestionRenderer
│   ├── questions/           # QuestionModal, AnswerEditor, ImageUploader, HotspotEditor, RichTextEditor
│   ├── dashboard/           # AttemptHistoryTable, StudentOverviewTable
│   └── analytics/           # ScoreDistributionChart, GroupBreakdownChart
└── utils/
    ├── avatar.js, certificate.js, format.js, scoreUtils.js, text.js
    └── questionImport.js    # Parse CSV/XLSX bulk import
docs/                        # Tài liệu source code (thư mục này)
supabase/
├── sql/                      # Migration SQL chạy tay qua Supabase Studio (không có supabase/migrations/ chuẩn CLI)
│   ├── 2026-07-08_six_features.sql         # ĐÃ chạy
│   ├── 2026-07-13_concurrency_indexes.sql  # Indexes + RPC get_student_attempt_stats/get_teacher_dashboard_stats — ĐÃ chạy trên DB live (2026-07-13, qua Management API)
│   ├── 2026-07-13_clear_exam_history.sql   # DELETE FROM exam_attempts toàn hệ thống (one-time wipe) — CHƯA chạy, chỉ tạo sẵn nếu cần dùng
│   ├── 2026-07-13_exam_draft_answers.sql   # ĐÃ chạy — cột draft_answers trên exam_attempts
│   ├── 2026-07-14_security_hardening.sql   # ĐÃ chạy TOÀN BỘ (xác nhận 2026-07-26, xem DATABASE_SCHEMA.md → RLS + RPC section)
│   └── 2026-07-15_leaderboard_streak.sql   # ĐÃ chạy toàn bộ 6 block (BLOCK 5/6 bị bỏ sót lúc đầu, deploy bù 2026-07-26 qua Management API — xem DATABASE_SCHEMA.md → get_my_leaderboard_rank)
└── functions/                # Source của tất cả 6 edge functions đang deploy (kéo về 2026-07-10,
                               # trước đó chỉ analyze-exam-stats có source local — 5 function còn lại
                               # deploy trực tiếp qua Dashboard/MCP không version-control)
```

## User Roles

| Role | Mô tả |
|---|---|
| `student` | Làm bài thi, xem kết quả, lịch sử cá nhân |
| `teacher` | Student + quản lý câu hỏi, student, analytics |

- `account_source = 'SELF'` → self-registered → cần mua bài thi
- `account_source = 'ADMIN'` → tạo bởi teacher → truy cập tự do

## Cấu trúc bài thi IC3

```
IC3 GS6 / GS7 / GS8
├── Level 1  (Testing 1-3, Gmetrix 1-2)
├── Level 2  (Testing 1-5, Gmetrix 1-2)
└── Level 3  (Testing 1-5, Gmetrix 1-2)
```

## Loại câu hỏi

| Type | Mô tả | Chấm điểm |
|---|---|---|
| `choice` | Chọn 1 đáp án (radio) | 1 đáp án đúng |
| `multi` | Chọn nhiều (checkbox) | Tất cả đúng mới tính điểm |
| `dragdrop` | Kéo thả pool→zone | Mỗi item đúng zone |
| `truefalse` | Đúng/Sai từng nhận định | All-or-nothing |
| `hotspot` | Click vùng ảnh | Click đúng region |

## Environment Variables

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SENTRY_DSN=...            # optional — bỏ trống để tắt Sentry
VITE_TURNSTILE_SITE_KEY=...    # optional — bỏ trống để tắt CAPTCHA trên /register
```
File `.env` — KHÔNG commit lên Git. Xem `.env.example` cho danh sách đầy đủ (kèm secret phía edge function `TURNSTILE_SECRET_KEY`, set qua Supabase Dashboard → Edge Functions → Secrets, không phải `.env`).

## Supabase RPC functions

19 RPC functions, tất cả tồn tại trên DB live (xác nhận 2026-07-26). Tất cả `SECURITY DEFINER` trừ `reorder_questions_in_exam`, `is_teacher` — chi tiết đầy đủ chữ ký ở [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md#rpc-functions-public-schema):

| RPC | Mô tả |
|---|---|
| `submit_exam_attempt` | Chấm điểm + lưu kết quả bài thi thường (thang 0-100) |
| `submit_mock_exam_attempt` | Chấm điểm bài thi thử, tính thêm `score_1000` (thang IC3 1000) |
| `create_mock_exam_attempt` | Random 45 (hoặc 10 dùng thử) câu trong 1 Level, tạo attempt mock |
| `user_can_access_exam` | Check quyền truy cập exam (self-registered) |
| `get_exam_questions_for_attempt` | Câu hỏi cho bài thi thường, KHÔNG có `is_correct`/`is_true` — dùng bởi `ExamPage`. Thêm 2026-07-14, thay `.select()` trực tiếp (lỗ hổng cũ: bất kỳ ai gọi REST API cũng đọc được đáp án đúng) |
| `get_mock_exam_questions` | Câu hỏi cho mock exam theo đúng `mock_question_ids` đã chốt — dùng bởi `MockExamPage`. Thêm 2026-07-14, cùng lý do trên |
| `get_flashcard_questions` | Câu hỏi cho flashcard — CÓ `is_correct`/`is_true` (cố ý, tính năng học bài) — dùng bởi `FlashcardPage`. Thêm 2026-07-14 |
| `get_question_wrong_stats` | Thống kê câu hay sai, filter đầy đủ trường/lớp/ngày (teacher-only) |
| `get_exam_score_distribution` | Histogram phân bố điểm (teacher-only) |
| `get_exam_group_breakdown` | Breakdown điểm TB theo lớp/trường/level, filter đầy đủ trường/lớp (teacher-only) |
| `get_student_attempt_stats` | Aggregate `totalAttempts`/`avgScore`/`lastActive` theo học sinh (teacher-only) — dùng bởi `useStudents.js` thay vì fetch raw `exam_attempts`. Thêm 2026-07-13, xem `supabase/sql/2026-07-13_concurrency_indexes.sql` |
| `get_teacher_dashboard_stats` | Aggregate `total_attempts`/`avg_score` toàn hệ thống, 1 dòng (teacher-only) — dùng bởi `DashboardPage.jsx`'s `useTeacherStats`. Thêm 2026-07-13, cùng file SQL trên |
| `record_purchase_payment` | Cộng dồn `paid_amount` nguyên tử (`SELECT...FOR UPDATE`, chống race webhook/teacher-confirm). Chỉ gọi được từ edge function (service role) — revoke khỏi `anon`/`authenticated`. Thêm 2026-07-14 |
| `check_and_record_registration_attempt` | Rate-limit đăng ký theo IP (bảng `registration_attempts`), chỉ service role gọi được. Thêm 2026-07-14 |
| `set_leaderboard_opt_in` | Student tự bật/tắt hiển thị trên bảng xếp hạng (`profiles.leaderboard_opt_in`). Thêm 2026-07-15 |
| `get_leaderboard` | Top N bảng xếp hạng streak/số bài theo lớp/trường/toàn hệ thống (opt-in only, không teacher-gated). Thêm 2026-07-15 |
| `get_my_leaderboard_rank` | Hạng của chính người gọi dù ngoài top hiển thị. Thêm 2026-07-15 (viết cùng lúc với `get_leaderboard` nhưng deploy trễ tới 2026-07-26 — xem DATABASE_SCHEMA.md → RPC section) |
| `reorder_questions_in_exam` | Chuẩn hoá lại `order_index` sau CRUD câu hỏi |
| `is_teacher` | Helper nội bộ cho RLS policies |

## Edge Functions

Nguồn cả 6 function nằm ở `supabase/functions/<slug>/index.ts` (kéo về từ Supabase 2026-07-10 — trước đó chỉ `analyze-exam-stats` có source local).

| Function | verify_jwt | Action | Mô tả |
|---|---|---|---|
| `manage-student` | true | create / update / toggle-active / delete / reset-password / clear-attempts / clear-all-attempts / delete-attempt | Teacher quản lý student (bảng `profiles`), cascade xoá `exam_attempts`/`purchases`/`payment_history` khi delete. `clear-attempts` (1 user, student hoặc teacher) / `clear-all-attempts` (toàn hệ thống) / `delete-attempt` (1 dòng `exam_attempts` theo `attemptId`) chỉ xoá lịch sử làm bài — **không đụng** `profiles`/`purchases`/`payment_history`/`auth.users`. Thêm 2026-07-13 |
| `manage-school` | true | list / create / update / delete | Teacher quản lý danh sách trường (bảng `schools`). `update`/`delete` cascade rename/clear `profiles.school` (free-text match theo tên, không phải FK) |
| `manage-purchase` | true | create / cancel / teacher-create / list-mine / list-all / confirm / status / history | Vòng đời mua bài thi (bảng `purchases`) — client KHÔNG ghi trực tiếp, trừ đường tự động `sepay-webhook` |
| `register-user` | false | — | Self-register tài khoản. Dùng `admin.auth.admin.createUser` (bypass rate-limit signup mặc định của Supabase Auth). **Có CAPTCHA + rate-limit** (thêm 2026-07-14, trước đó thực sự không có — xem `2026-07-14_security_hardening.sql` BLOCK 3): verify Cloudflare Turnstile server-side qua `siteverify` (no-op nếu thiếu secret `TURNSTILE_SECRET_KEY`) **và** rate-limit độc lập theo IP (5 lần/giờ mặc định, RPC `check_and_record_registration_attempt`, luôn bật bất kể có CAPTCHA hay không) |
| `analyze-exam-stats` | true | — | Teacher-only, gọi Gemini API (`gemini-2.5-flash`) sinh nhận xét tiếng Việt cho AnalyticsPage. Cần secret `GEMINI_API_KEY` |
| `sepay-webhook` | false | — | Nhận webhook từ SePay khi phát hiện chuyển khoản ngân hàng, tự động khớp `transaction_code` trong nội dung chuyển khoản → cập nhật `purchases.status`/`paid_amount`. **Bắt buộc** secret `SEPAY_WEBHOOK_SECRET` (fail-closed — từ chối mọi request nếu thiếu secret, xem header `Authorization`/`x-sepay-signature`). Không có route gọi từ `src/` — chỉ SePay gọi vào |

## Storage Buckets

| Bucket | Dùng cho |
|---|---|
| `question-images` | Ảnh câu hỏi + drag items |
| `answer-images` | Ảnh đáp án + drop zones |

Cả 2 bucket: public read, authenticated write, chỉ Teacher upload.

## Cấu hình Supabase Client

```js
// src/lib/supabase.js
createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  realtime: { params: { eventsPerSecond: 2 } }
})
```

## Ngưỡng Pass/Fail

- Bài thi thường (`exam_attempts.score`, thang 0-100): Score >= 70% → PASS (xem `src/utils/scoreUtils.js`: `isPassed(score)`)
- Mock exam (`exam_attempts.score_1000`, thang IC3 0-1000): Score >= 700 → PASS (hard-coded trong `MockResultPage.jsx`, **không** dùng `isPassed()`)
