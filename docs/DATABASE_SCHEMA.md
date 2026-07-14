# IC3 Exam Platform — Database Schema

> Xác minh trực tiếp từ Supabase (`information_schema` + `pg_policies` + `pg_proc`) ngày 2026-07-10.
> **Lưu ý**: bảng/cột thực tế lệch khá nhiều so với tên gọi trực quan trong code — xem phần "Bẫy thường gặp" cuối file.

## Supabase PostgreSQL Tables

### `profiles`
```sql
id                  uuid PRIMARY KEY REFERENCES auth.users(id)
email               text NOT NULL
full_name           text
role                text NOT NULL CHECK (role IN ('student', 'teacher'))
created_by          uuid REFERENCES profiles(id)          -- nullable
is_active           boolean NOT NULL DEFAULT true
created_at          timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()
is_logged_in        boolean NOT NULL DEFAULT false         -- single-session tracking
session_expires_at  timestamptz                            -- nullable
school              text                                   -- ⚠️ TEXT, không phải FK uuid! Free-text tên trường
class_name          text                                   -- nullable
account_source      text NOT NULL DEFAULT 'ADMIN' CHECK (account_source IN ('ADMIN', 'SELF'))
```
> **⚠️ `school` là `text` tự do, KHÔNG PHẢI `school_id uuid REFERENCES schools(id)`.** Không có FK giữa `profiles` và `schools` — liên kết chỉ qua so khớp chuỗi tên (`profiles.school === schools.name`, xem `AnalyticsPage.jsx`, `StudentManagementPage.jsx`). RPC `get_exam_group_breakdown`/`get_exam_score_distribution` join `schools` bằng `s.id::text = p.school`.

### `schools`
```sql
id         uuid PRIMARY KEY DEFAULT gen_random_uuid()
name       text NOT NULL UNIQUE
created_at timestamptz DEFAULT now()
```
CRUD qua Edge Function `manage-school` (không phải insert/update trực tiếp) — action `list`/`create`/`update`/`delete`.

### `exam_levels`
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
version      text NOT NULL        -- 'GS6', 'GS7', 'GS8'...
level_number int NOT NULL         -- 1, 2, 3...
label        text NOT NULL        -- 'Level 1'
created_at   timestamptz DEFAULT now()
```

### `exams`
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
level_id         uuid REFERENCES exam_levels(id)
exam_type        text NOT NULL CHECK (exam_type IN ('testing', 'gmetrix'))
exam_number      int NOT NULL
title            text NOT NULL
duration_seconds int NOT NULL
created_at       timestamptz DEFAULT now()
required_amount  int DEFAULT 100000    -- giá bài thi (VNĐ), per-exam — KHÔNG có bảng giá tập trung
```

### `questions`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
exam_id         uuid REFERENCES exams(id)
question_type   text NOT NULL CHECK (question_type IN ('choice', 'multi', 'dragdrop', 'truefalse', 'hotspot'))
content         text NOT NULL    -- HTML từ RichTextEditor
image_url       text
order_index     int NOT NULL DEFAULT 0
hotspot_multi   boolean DEFAULT false  -- cho hotspot: chọn nhiều vùng
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### `answers`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
question_id     uuid REFERENCES questions(id) ON DELETE CASCADE
content         text NOT NULL    -- HTML
image_url       text
is_correct      boolean NOT NULL DEFAULT false
order_index     int NOT NULL DEFAULT 0
created_at      timestamptz DEFAULT now()
```
> **Bảo mật**: `is_correct` KHÔNG trả về client khi đang làm bài — chỉ gửi sau khi submitted.

### `dragdrop_pairs`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
question_id     uuid REFERENCES questions(id) ON DELETE CASCADE
drag_content    text NOT NULL     -- text của drag item
drag_image_url  text              -- ảnh drag item (bucket: question-images)
drop_content    text NOT NULL     -- tên nhóm/zone (các pairs cùng drop_content = cùng zone)
drop_image_url  text              -- ảnh drop zone (bucket: answer-images)
order_index     int NOT NULL DEFAULT 0
```
> **Thiết kế DragDrop**: Nhiều pairs có cùng `drop_content` = cùng 1 drop zone.

### `truefalse_statements`
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
question_id  uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE
content      text NOT NULL       -- HTML nội dung nhận định
is_true      boolean NOT NULL DEFAULT true
order_index  int NOT NULL DEFAULT 0
created_at   timestamptz DEFAULT now()
```
> Chấm điểm **all-or-nothing**: tất cả nhận định đúng mới tính điểm.

### `hotspot_regions`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
question_id uuid REFERENCES questions(id) ON DELETE CASCADE
x           numeric NOT NULL DEFAULT 0    -- % từ trái ảnh
y           numeric NOT NULL DEFAULT 0    -- % từ trên ảnh
width       numeric NOT NULL DEFAULT 10   -- %
height      numeric NOT NULL DEFAULT 10   -- %
is_correct  boolean NOT NULL DEFAULT true
label       text
order_index int NOT NULL DEFAULT 0
color       text DEFAULT '#6366F1'        -- màu viền vùng trong HotspotEditor
```

### `exam_attempts`
```sql
id                      uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id                 uuid REFERENCES profiles(id)
exam_id                 uuid REFERENCES exams(id)
started_at              timestamptz NOT NULL DEFAULT now()
submitted_at            timestamptz
time_spent_seconds      int
score                   numeric               -- 0-100 (%)
total_questions         int NOT NULL
correct_count           int NOT NULL DEFAULT 0
status                  text NOT NULL CHECK (status IN ('in_progress', 'submitted', 'auto_submitted'))
created_at              timestamptz DEFAULT now()
is_mock                 boolean DEFAULT false          -- true nếu tạo qua create_mock_exam_attempt
mock_question_ids       uuid[]                         -- 45 (hoặc 10 dùng thử) câu random cho mock exam
score_1000              numeric                        -- điểm quy đổi thang IC3 1000, chỉ dùng khi is_mock=true
current_question_index  int NOT NULL DEFAULT 0          -- live tracking (LiveMonitorPage)
last_activity_at        timestamptz NOT NULL DEFAULT now() -- ping từ client mỗi 4s
draft_answers           jsonb NOT NULL DEFAULT '{}'::jsonb -- { answers, flagged } — Resume Session Pattern, ghi kèm ping 4s. Thêm 2026-07-13, xem `supabase/sql/2026-07-13_exam_draft_answers.sql`
```
> **Pass threshold khác nhau theo loại bài**: `exam_attempts` thường (`score`, thang 0-100) → pass ≥70 (`utils/scoreUtils.js`). Mock exam (`score_1000`, thang 0-1000) → pass ≥700 (hard-coded trong `MockResultPage.jsx`, KHÔNG dùng `isPassed()`).
> **`status='auto_submitted'` có 2 nguồn gốc khác nhau** (kể từ khi ExamPage có Resume Session — xem PATTERNS_AND_CONVENTIONS.md #22): (1) Timer hết giờ → `doSubmit(true)` → RPC `submit_exam_attempt` chấm điểm thật như bình thường; (2) học sinh bấm "Bắt đầu lại" trên `ResumeModal` khi có attempt cũ dở dang → client `UPDATE` trực tiếp `status='auto_submitted', submitted_at=now()` cho attempt cũ, **KHÔNG** qua RPC, **KHÔNG có** `score`/`correct_count` (giữ nguyên default 0/NULL) vì chưa từng có answers để chấm. Khi đọc lịch sử/thống kê theo `auto_submitted`, cân nhắc loại trừ các row `score IS NULL` nếu cần phân biệt "hết giờ thật" với "bị hủy vì làm lại".

### `attempt_answers`
```sql
id                   uuid PRIMARY KEY DEFAULT gen_random_uuid()
attempt_id           uuid REFERENCES exam_attempts(id) ON DELETE CASCADE
question_id          uuid REFERENCES questions(id)
selected_answer_ids  uuid[]   -- cho choice/multi/hotspot
dragdrop_response    jsonb    -- { pairId: dropContent } hoặc { statementId: bool } cho truefalse
is_correct           boolean
created_at           timestamptz DEFAULT now()
```

### `exam_cheat_events`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
attempt_id  uuid REFERENCES exam_attempts(id)
user_id     uuid REFERENCES profiles(id)
event_type  text CHECK (event_type IN ('tab_switch', 'fullscreen_exit'))
created_at  timestamptz DEFAULT now()
```

### `purchases` (⚠️ tên bảng thực tế — KHÔNG PHẢI `exam_purchases`)
```sql
id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id           uuid REFERENCES auth.users(id)
exam_id           uuid REFERENCES exams(id)
required_amount   int NOT NULL DEFAULT 100000
paid_amount       int NOT NULL DEFAULT 0
status            text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PARTIAL', 'SUCCESS', 'FAILED'))
transaction_code  text NOT NULL UNIQUE     -- mã giao dịch, hiện trong nội dung chuyển khoản
notes             text
created_at        timestamptz DEFAULT now()
updated_at        timestamptz DEFAULT now()
```
> Hỗ trợ **thanh toán một phần** (`PARTIAL`): `paid_amount` tăng dần qua nhiều lần chuyển khoản, `status` tự chuyển `SUCCESS` khi `paid_amount >= required_amount`. Toàn bộ CRUD qua Edge Function `manage-purchase` (actions: `create`, `cancel`, `teacher-create`, `list-mine`, `list-all`, `confirm`, `status`, `history`) — không insert/update trực tiếp từ client.
> **Cập nhật tự động qua `sepay-webhook`** (public, `verify_jwt=false`): SePay gọi vào khi phát hiện chuyển khoản ngân hàng khớp `transaction_code`, tự set `paid_amount`/`status`. Bắt buộc secret `SEPAY_WEBHOOK_SECRET` (fail-closed) — nếu thiếu, function từ chối toàn bộ request thay vì bỏ qua xác thực.

### `payment_history`
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
purchase_id  uuid NOT NULL REFERENCES purchases(id)
amount       int NOT NULL
note         text
recorded_by  uuid REFERENCES auth.users(id)   -- teacher ghi nhận thanh toán thủ công
payment_time timestamptz NOT NULL DEFAULT now()
```
Log từng lần chuyển khoản của một `purchase` (hỗ trợ partial payment nhiều lần).

### `payment_config` (⚠️ tên bảng thực tế — KHÔNG PHẢI `payment_settings`, KHÔNG có cột `prices`)
```sql
id            int PRIMARY KEY DEFAULT 1 CHECK (id = 1)   -- bảng singleton, luôn 1 dòng
bank_id       text NOT NULL DEFAULT 'MB'
account_no    text NOT NULL DEFAULT ''
account_name  text NOT NULL DEFAULT ''
updated_at    timestamptz DEFAULT now()
```
> Giá bài thi nằm ở `exams.required_amount` (per-exam), KHÔNG phải `jsonb` trong bảng này. `PaymentModal.jsx` cache row này ở module-level (fetch 1 lần/session).

### `todos` — ⚠️ bảng KHÔNG liên quan đến app (không được reference ở bất kỳ đâu trong `src/`)
```sql
id         uuid PRIMARY KEY DEFAULT gen_random_uuid()
title      text
is_done    boolean DEFAULT false
created_at timestamp DEFAULT now()
```
> **Cảnh báo bảo mật**: `RLS đang TẮT` trên bảng này — bất kỳ ai có anon key đều đọc/ghi được. Có vẻ là bảng mẫu còn sót lại từ template dự án, không phải dữ liệu thật. Cân nhắc bật RLS hoặc xoá bảng nếu không dùng; KHÔNG tự động sửa mà chưa hỏi ý người phụ trách DB (xem quy tắc phê duyệt hành động trên prod DB).

---

## Row Level Security (RLS)

Helper function: `is_teacher()` — `SECURITY DEFINER`, trả `true` nếu `auth.uid()` có `role='teacher'` trong `profiles`. Dùng trong hầu hết policies thay vì lặp lại `EXISTS (SELECT 1 FROM profiles ...)` (một số bảng cũ hơn — `hotspot_regions`, `truefalse_statements`, `payment_config`, `payment_history`, `schools` — vẫn dùng dạng `EXISTS` viết tay, chưa refactor sang `is_teacher()`).

| Bảng | Policy | Cmd | Điều kiện |
|---|---|---|---|
| `profiles` | select own | SELECT | `auth.uid() = id` |
| `profiles` | select teacher | SELECT | `is_teacher()` |
| `profiles` | update own | UPDATE | `auth.uid() = id` |
| `profiles` | update own session status | UPDATE | `auth.uid() = id` (riêng cho `is_logged_in`/`session_expires_at`) |
| `profiles` | update teacher | UPDATE | `is_teacher() AND role='student'` |
| `profiles` | delete teacher | DELETE | `is_teacher() AND role='student'` |
| `schools` | teachers_all_schools | ALL | teacher role (EXISTS check) |
| `schools` | students_read_schools | SELECT | `true` (mọi authenticated user đọc được) |
| `exam_levels` | select_auth / insert·update·delete_teacher | * | `auth.role()='authenticated'` (SELECT) / `is_teacher()` (write) |
| `exams` | select_auth / insert·update·delete_teacher | * | như trên |
| `questions` | select_auth / insert·update·delete_teacher | * | như trên |
| `answers` | select_auth / insert·update·delete_teacher | * | như trên |
| `dragdrop_pairs` | select_auth / insert·update·delete_teacher | * | như trên |
| `truefalse_statements` | read all / write teacher | * | `true` (SELECT) / EXISTS teacher (write) |
| `hotspot_regions` | read all / write teacher | * | `true` (SELECT) / EXISTS teacher (write) |
| `exam_attempts` | insert own | INSERT | `auth.uid()=user_id AND user_can_access_exam(auth.uid(), exam_id)` |
| `exam_attempts` | select own / select teacher | SELECT | `auth.uid()=user_id` / `is_teacher()` |
| `exam_attempts` | update own | UPDATE | `auth.uid()=user_id` |
| `attempt_answers` | insert/select own | * | attempt thuộc về user hiện tại (subquery `exam_attempts`) |
| `attempt_answers` | select teacher | SELECT | `is_teacher()` |
| `exam_cheat_events` | insert own | INSERT | `auth.uid()=user_id` |
| `exam_cheat_events` | select own / select teacher | SELECT | `auth.uid()=user_id` / role=teacher (EXISTS) |
| `purchases` | insert/select own | * | `auth.uid()=user_id` |
| `purchases` | select/update teacher | * | role=teacher (EXISTS) |
| `payment_history` | select own | SELECT | purchase liên kết thuộc user hiện tại |
| `payment_history` | insert/select teacher | * | role=teacher (EXISTS) |
| `payment_config` | read all | SELECT | `true` |
| `payment_config` | write teacher | ALL | role=teacher (EXISTS) |
| `todos` | — | — | **RLS TẮT — không có policy nào** |

---

## RPC Functions (public schema)

Tất cả RPC nghiệp vụ (trừ `reorder_questions_in_exam`, `is_teacher`) đều `SECURITY DEFINER` và tự kiểm tra quyền bên trong (raise exception nếu sai role) — không dựa hoàn toàn vào RLS.

### `is_teacher()`
```sql
RETURNS boolean  -- SECURITY DEFINER, helper cho RLS policies, không gọi trực tiếp từ client
```

### `user_can_access_exam(p_user_id uuid, p_exam_id uuid)`
```sql
RETURNS boolean
```
Dùng khi `isSelfRegistered=true` để chặn truy cập bài thi chưa mua (`ExamPage`, `FlashcardPage`).

### `submit_exam_attempt(...)`
```sql
p_attempt_id uuid, p_time_spent int, p_answers jsonb, p_tf_answers jsonb, p_dd_answers jsonb, p_is_auto boolean DEFAULT false
RETURNS jsonb   -- { score, correct_count, total, ... }
```
Dùng cho bài thi thường (`ExamPage`). Idempotent — báo lỗi `already_submitted` nếu gọi lại.

### `submit_mock_exam_attempt(...)`
```sql
-- Cùng chữ ký với submit_exam_attempt
RETURNS jsonb   -- gồm score_1000
```
Dùng riêng cho `MockExamPage` — tính thêm `score_1000` (thang IC3 1000 điểm).

### `create_mock_exam_attempt(p_level_id uuid, p_user_id uuid)`
```sql
RETURNS uuid   -- attempt_id mới tạo
```
Random 45 câu (hoặc 10 nếu chưa thanh toán đủ các exam trong Level — self-registered) từ toàn bộ Level, set `is_mock=true`, `mock_question_ids`. Raise `no_questions_found` nếu Level rỗng.

### `reorder_questions_in_exam(p_exam_id uuid)`
```sql
RETURNS void   -- NOT security definer
```
Chuẩn hoá lại `order_index` liên tục (0,1,2...) sau khi thêm/xoá/sửa câu hỏi. Gọi từ `QuestionsPage`, `QuestionFormPage`, `questionImport.js`.

### `get_question_wrong_stats(...)`
```sql
p_min_attempts int DEFAULT 5, p_level_id uuid DEFAULT NULL, p_exam_type text DEFAULT NULL, p_question_type text DEFAULT NULL
RETURNS TABLE(question_id, exam_id, exam_title, level_label, exam_type, exam_number, question_type, content, total_attempts, wrong_count, wrong_pct)
```
Teacher-only (raise exception nếu không phải teacher). Dùng ở `QuestionStatsPage` và `AnalyticsPage`.

### `get_exam_score_distribution(...)`
```sql
p_level_id uuid DEFAULT NULL, p_exam_type text DEFAULT NULL, p_date_from timestamptz DEFAULT NULL,
p_date_to timestamptz DEFAULT NULL, p_school_id text DEFAULT NULL, p_class_name text DEFAULT NULL, p_pass_filter text DEFAULT NULL
RETURNS TABLE(bucket_label text, bucket_min int, attempt_count bigint)   -- histogram bucket 10 điểm
```
⚠️ `p_school_id` là **`text`** (khớp `profiles.school`), không phải `uuid`. Teacher-only. Dùng ở `AnalyticsPage` → `ScoreDistributionChart`.

### `get_exam_group_breakdown(...)`
```sql
p_group_by text ('class'|'school'|'level'), p_level_id uuid DEFAULT NULL, p_exam_type text DEFAULT NULL,
p_date_from timestamptz DEFAULT NULL, p_date_to timestamptz DEFAULT NULL, p_pass_filter text DEFAULT NULL
RETURNS TABLE(group_label text, total_attempts bigint, avg_score numeric, pass_pct numeric)
```
Teacher-only. Dùng ở `AnalyticsPage` → `GroupBreakdownChart`.

### `get_student_attempt_stats()`
```sql
RETURNS TABLE(user_id uuid, total_attempts bigint, avg_score numeric, last_active timestamptz)
```
Teacher-only. Thêm 2026-07-13 (`supabase/sql/2026-07-13_concurrency_indexes.sql`) — group-by aggregate trên `exam_attempts` (loại `status='in_progress'`), 1 dòng/học sinh có attempt. Dùng bởi `useStudents.js` thay cho việc fetch nguyên bảng `exam_attempts` (payload trước đây lớn dần vô hạn theo lịch sử làm bài tích luỹ toàn hệ thống, không liên quan số học sinh đang xem trang).

### `get_teacher_dashboard_stats()`
```sql
RETURNS TABLE(total_attempts bigint, avg_score numeric)   -- luôn đúng 1 dòng
```
Teacher-only. Thêm 2026-07-13, cùng file SQL trên. Dùng bởi `DashboardPage.jsx`'s `useTeacherStats` — trước đó gọi `useExamAttempts(null, { select: 'score' })` (userId=null → không filter theo user) fetch TOÀN BỘ `exam_attempts` platform-wide mỗi lần Dashboard (landing page sau login) load, chỉ để COUNT/AVG ở client.

---

## Bẫy thường gặp (đã từng gây lỗi thật)

- **`profiles.school` là `text`, không phải `uuid`/FK.** Một migration trước đó (`supabase/sql/2026-07-08_six_features.sql`) từng giả định `uuid` và gây lỗi `operator does not exist: text = uuid` trên AnalyticsPage — đã fix bằng `DROP FUNCTION` + `CREATE FUNCTION` lại (đổi chữ ký tham số, không dùng `CREATE OR REPLACE` vì thay đổi kiểu tham số).
- **Bảng mua bài là `purchases`, không phải `exam_purchases`.** Bảng cấu hình thanh toán là `payment_config` (singleton, id=1), không phải `payment_settings`, và KHÔNG có cột `prices jsonb` — giá nằm ở `exams.required_amount`.
- **Không tự ý viết/sửa trực tiếp vào `purchases`/`payment_history`/`schools` (ngoại trừ RLS fallback update tên trường) từ client** — luôn qua Edge Functions (`manage-purchase`, `manage-school`) để giữ tính nhất quán (side-effect như tính `paid_amount`, kiểm tra quyền).
- **`exam_attempts` phục vụ cả bài thi thường lẫn mock exam** — phân biệt bằng `is_mock`. Đọc/ghi điểm phải chọn đúng cột: `score` (0-100, bài thường) vs `score_1000` (0-1000, mock) — nhầm cột sẽ cho ra ngưỡng pass sai (70 vs 700).
- Trước khi viết SQL/RPC mới dựa trên schema tài liệu hoá ở đây: **luôn `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '...'` để xác nhận lại**, vì schema có thể đã đổi sau lần cập nhật doc này (2026-07-10).
- **`exam_attempts` KHÔNG có RLS policy DELETE nào** (chỉ insert own / select own+teacher / update own — xem bảng RLS ở trên). Đây là chủ ý: xoá lịch sử làm bài (1 dòng, 1 student/teacher, hoặc toàn hệ thống) chỉ thực hiện qua Edge Function `manage-student` (`delete-attempt`/`clear-attempts`/`clear-all-attempts`, thêm 2026-07-13) — dùng service role, tự kiểm tra `role='teacher'` ở đầu function, KHÔNG dựa vào RLS. Client không thể tự `DELETE FROM exam_attempts` trực tiếp dù có JWT hợp lệ.
- **Không tìm thấy `CREATE INDEX` nào trong `supabase/sql/` trước 2026-07-13** — các cột filter hot-path (`exam_attempts.user_id/exam_id/status/is_mock/last_activity_at`, `exam_cheat_events.attempt_id`, `questions.exam_id`, `attempt_answers.attempt_id/question_id`, `purchases.user_id`) không chắc có index trên DB thật (schema doc này reverse-engineer từ `information_schema`, không phải nguồn đầy đủ). Đã thêm `supabase/sql/2026-07-13_concurrency_indexes.sql` (dùng `CREATE INDEX CONCURRENTLY IF NOT EXISTS`, chưa chạy — cần tự chạy tay qua Supabase Studio) để bù các cột này, phục vụ tải đồng thời nhiều học sinh/giáo viên. Xác nhận bằng `SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public'` trước khi giả định đã có/chưa có.
