# IC3 Exam Platform — Project Overview

## Tổng quan

Nền tảng thi trực tuyến IC3 (Internet and Computing Core Certification) xây dựng bằng **ReactJS 19 + Vite + Supabase**.

- **Repository**: `c:\TinHoc\Cap2\Testing4`
- **Dev server**: `npm run dev` → http://localhost:5173
- **Deploy**: Vercel (xem `vercel.json`)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19.x + Vite 5.x |
| Styling | Tailwind CSS v3.x |
| Backend / DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Storage | Supabase Storage (`question-images`, `answer-images`) |
| State | React Context API (AuthContext, ThemeContext) |
| Routing | React Router v7 |
| Icons | Lucide React |
| PDF | jsPDF (certificate) |
| Excel | ExcelJS (import câu hỏi) |

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
├── pages/                   # 22 page components (lazy-loaded)
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
```
File `.env` — KHÔNG commit lên Git.

## Supabase RPC functions

| RPC | Params | Mô tả |
|---|---|---|
| `submit_exam_attempt` | p_attempt_id, p_time_spent, p_answers, p_tf_answers, p_dd_answers, p_is_auto | Chấm điểm + lưu kết quả |
| `user_can_access_exam` | p_user_id, p_exam_id | Check quyền truy cập exam |
| `get_question_wrong_stats` | p_min_attempts, p_level_id, p_exam_type, p_question_type | Thống kê câu hay sai |

## Edge Functions

| Function | Action | Mô tả |
|---|---|---|
| `manage-student` | create / delete / reset-password | Teacher quản lý student |
| `manage-purchase` | cancel | Hủy giao dịch thanh toán |
| `register-user` | — | Self-register tài khoản |

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

Score >= 70% → PASS (xem `src/utils/scoreUtils.js`: `isPassed(score)`)
