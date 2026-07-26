# IC3 Exam Platform — Database Schema

> Xác minh trực tiếp từ Supabase (`information_schema` + `pg_policies` + `pg_proc`) ngày 2026-07-26 (lần trước 2026-07-10 — đã lệch khá nhiều, xem các mục có ghi chú "cập nhật 2026-07-26" bên dưới).
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
current_streak      int NOT NULL DEFAULT 0                 -- số ngày liên tiếp có nộp bài (thêm 2026-07-15)
longest_streak      int NOT NULL DEFAULT 0                 -- kỷ lục streak, GREATEST tự cập nhật
last_streak_date    date                                    -- ngày (giờ VN) lần cuối tính streak, nullable
leaderboard_opt_in  boolean NOT NULL DEFAULT false          -- student tự bật để hiện trên LeaderboardPage
```
> **Gamification (thêm 2026-07-15, `supabase/sql/2026-07-15_leaderboard_streak.sql`)**: 4 cột trên phục vụ streak luyện tập + bảng xếp hạng opt-in. `current_streak`/`longest_streak`/`last_streak_date` do trigger `trg_update_streak_on_submit` tự tính (xem RPC/Trigger section) — client KHÔNG tự ghi. `AuthContext.jsx`'s `fetchProfile()` dùng `select('*')` nên 4 cột này tự có sẵn trong `profile` object, không cần sửa code fetch. **`current_streak` là số liệu thô** — chỉ cập nhật lúc có bài nộp mới, có thể "ảo" (chưa phản ánh streak đã gãy) cho tới lần nộp kế tiếp; luôn tính lại qua `getEffectiveStreak()` (`src/utils/streak.js`, dùng ở `DashboardPage`) hoặc logic tương đương trong SQL (RPC `get_leaderboard`/`get_my_leaderboard_rank`) trước khi hiển thị/xếp hạng.
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

### `registration_attempts` — nội bộ, không có policy nào (cập nhật 2026-07-26)
```sql
id         uuid PRIMARY KEY DEFAULT gen_random_uuid()
ip         text NOT NULL
created_at timestamptz NOT NULL DEFAULT now()
```
> Thêm bởi `supabase/sql/2026-07-14_security_hardening.sql` BLOCK 3. Đếm số lần đăng ký theo IP (5 lần/giờ mặc định) cho Edge Function `register-user`, độc lập với Turnstile CAPTCHA — chặn 1 script mass-create account vì `register-user` cố tình bypass rate-limit mặc định của Supabase Auth (`admin.auth.admin.createUser`). RLS **bật, không có policy nào** — đây là chủ ý (fail-closed): chỉ RPC `check_and_record_registration_attempt` (`SECURITY DEFINER`, revoke khỏi `anon`/`authenticated`, chỉ `postgres`/`service_role` gọi được) chạm vào bảng này. Tự dọn dòng cũ hơn 1 giờ ngay trong RPC, không cần cron riêng.

> **Bảng `todos` không còn tồn tại trên DB live** (đã xác nhận qua `information_schema.tables` 2026-07-26). Version trước của tài liệu này (2026-07-10) cảnh báo bảng này có RLS tắt hoàn toàn — `2026-07-14_security_hardening.sql` BLOCK 5 định bật RLS cho nó nếu còn tồn tại; tại thời điểm review 2026-07-26 bảng đã biến mất khỏi `public` schema hoàn toàn (bị xoá hẳn, không rõ chính xác khi nào/bởi ai — không có migration nào trong `supabase/sql/` ghi lại việc `DROP TABLE todos`). Không cần hành động gì thêm.

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
| `dragdrop_pairs` | select_auth / insert·update·delete_teacher | * | như trên — **không** siết như answers/truefalse/hotspot bên dưới, vì `drop_content` là tên cột/zone cần hiển thị để học sinh thao tác kéo-thả, không phải "đáp án đúng" ẩn (xem `dragdrop_pairs` ở trên) |
| `answers` | select_teacher_or_own_submitted | SELECT | `is_teacher() OR` (user có `exam_attempts` **đã submit** — không `in_progress` — cho đúng exam chứa câu hỏi đó). **Siết lại 2026-07-14** (trước đó: `select_auth`, bất kỳ authenticated user nào đọc được `is_correct` của MỌI câu hỏi qua REST API trực tiếp) |
| `answers` | insert/update/delete_teacher | * | `is_teacher()` |
| `truefalse_statements` | select_teacher_or_own_submitted | SELECT | như `answers` ở trên (thay `is_correct` bằng `is_true`). Siết lại 2026-07-14 |
| `truefalse_statements` | Teachers can insert/update/delete | * | EXISTS teacher (chưa refactor sang `is_teacher()`) |
| `hotspot_regions` | select_teacher_or_own_submitted | SELECT | như `answers` ở trên. Siết lại 2026-07-14 |
| `hotspot_regions` | Teachers can insert/update/delete | * | EXISTS teacher (chưa refactor sang `is_teacher()`) |
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
| `registration_attempts` | — | — | **RLS BẬT, không có policy nào** (chủ ý — chỉ RPC `SECURITY DEFINER` chạm được, xem bảng ở trên) |

**Vì sao `answers`/`truefalse_statements`/`hotspot_regions` giờ chặn SELECT khi đang thi**: trước 2026-07-14, `ExamPage`/`MockExamPage`/`FlashcardPage` tự `.select()` các bảng này trực tiếp qua Supabase client, và RLS SELECT khi đó là `auth.role()='authenticated'` — bất kỳ ai đăng nhập gọi thẳng REST API (DevTools/Postman) đều đọc được `is_correct`/`is_true` của **mọi câu hỏi trong mọi đề**, không phụ thuộc đã mua/đã thi hay chưa. `supabase/sql/2026-07-14_security_hardening.sql` BLOCK 1 vá lỗ hổng này bằng 2 lớp: (1) RLS SELECT giờ chỉ cho teacher hoặc chính học sinh sở hữu 1 attempt **đã submit** (đúng luồng "xem lại sau khi nộp" của `ResultPage`), (2) 3 trang trên chuyển sang gọi RPC `SECURITY DEFINER` mới (`get_exam_questions_for_attempt`/`get_mock_exam_questions`/`get_flashcard_questions`, xem RPC section) thay vì `.select()` trực tiếp — RPC tự kiểm tra quyền mua bài và **không** trả `is_correct`/`is_true` (trừ `get_flashcard_questions`, cố tình có vì đó là tính năng học bài).

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

### `get_exam_questions_for_attempt(p_exam_id uuid)` — thêm 2026-07-14
```sql
RETURNS jsonb  -- mảng question objects: answers/dragdrop_pairs/truefalse_statements/hotspot_regions lồng bên trong
```
`SECURITY DEFINER`. Dùng bởi `ExamPage.jsx` thay cho `.select()` trực tiếp trên `questions`/`answers`/... (xem RLS section ở trên — lý do đổi). Tự kiểm tra `user_can_access_exam` nếu `account_source='SELF'`. **Không** trả `is_correct`/`is_true`/hotspot `is_correct` — an toàn để gọi khi bài thi đang `in_progress`.

### `get_mock_exam_questions(p_attempt_id uuid)` — thêm 2026-07-14
```sql
RETURNS jsonb  -- cùng cấu trúc RPC trên, thứ tự theo exam_attempts.mock_question_ids
```
`SECURITY DEFINER`. Dùng bởi `MockExamPage.jsx`. Nhận `p_attempt_id` (không nhận mảng question id tuỳ ý từ client) — tự tra `mock_question_ids` + kiểm tra `auth.uid()` là chủ sở hữu attempt (hoặc `is_teacher()`) trước khi trả câu hỏi. Cũng không trả `is_correct`/`is_true`.

### `get_flashcard_questions(p_exam_id uuid)` — thêm 2026-07-14
```sql
RETURNS jsonb  -- cùng cấu trúc 2 RPC trên, NHƯNG CÓ answers[].is_correct / truefalse_statements[].is_true / hotspot_regions[].is_correct
```
`SECURITY DEFINER`. Dùng bởi `FlashcardPage.jsx` — cố ý trả đáp án đúng vì đây là tính năng học bài (xem đáp án ngay sau khi chọn), khác 2 RPC thi ở trên. Vẫn kiểm tra `user_can_access_exam` nếu self-registered.

### `record_purchase_payment(p_purchase_id uuid, p_amount int, p_note text DEFAULT NULL, p_recorded_by uuid DEFAULT NULL)` — thêm 2026-07-14
```sql
RETURNS jsonb  -- { success, newStatus, newPaid, remaining, unlocked, alreadySuccess? }
```
`SECURITY DEFINER`, **REVOKE khỏi `anon`/`authenticated`** — chỉ gọi được từ edge function bằng service role (`manage-purchase`'s `confirm`/`teacher-create`, `sepay-webhook`). Không tự kiểm tra quyền người gọi bên trong (tin tưởng hoàn toàn edge function đã check trước) nên **không được** grant cho client. `SELECT ... FOR UPDATE` khoá dòng `purchases` khi cộng dồn `paid_amount` — chống race condition khi webhook SePay và giáo viên bấm "Xác nhận" gần như đồng thời (trước đó 2 request đọc-rồi-ghi riêng lẻ có thể mất 1 khoản thanh toán).

### `check_and_record_registration_attempt(p_ip text, p_max_per_hour int DEFAULT 5)` — thêm 2026-07-14
```sql
RETURNS boolean  -- false nếu IP đã vượt quá p_max_per_hour lần trong 1 giờ qua
```
`SECURITY DEFINER`, **REVOKE khỏi `anon`/`authenticated`** — chỉ gọi từ Edge Function `register-user` (service role). Ghi/dọn bảng `registration_attempts` (xem bảng ở trên).

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

### `set_leaderboard_opt_in(p_opt_in boolean)`
```sql
RETURNS void
```
Thêm 2026-07-15. Student tự bật/tắt hiển thị trên `LeaderboardPage` — chỉ sửa đúng cột `profiles.leaderboard_opt_in` của chính `auth.uid()` (đi qua RPC thay vì `.update()` trực tiếp dù RLS "update own" cho phép, để không mở bề mặt ghi tuỳ ý lên các cột khác).

### `get_leaderboard(p_scope, p_scope_value, p_metric, p_limit)`
```sql
p_scope text ('class'|'school'|'global'), p_scope_value text DEFAULT NULL, p_metric text DEFAULT 'streak', p_limit int DEFAULT 50
RETURNS TABLE(user_id, full_name, class_name, school, current_streak, longest_streak, total_attempts, rank)
```
Thêm 2026-07-15 (`supabase/sql/2026-07-15_leaderboard_streak.sql`). Dùng ở `LeaderboardPage`. **Không** teacher-gated (dữ liệu học sinh tự nguyện công khai, chỉ trả `leaderboard_opt_in=true`) nhưng cố tình **không có** điểm trung bình — chỉ streak/số bài. ⚠️ `p_scope_value` nhận từ client nhưng **bị bỏ qua** với scope `class`/`school` — server luôn tự lấy `class_name`/`school` thật từ profile của `auth.uid()`, chặn 1 user tự sửa request để xem leaderboard lớp/trường khác. `current_streak` trả về là giá trị **đã tính lại "hiệu lực"** trong SQL (cùng công thức `getEffectiveStreak` phía client), không phải cột thô. `p_limit` bị `LEAST(..., 200)` — trần an toàn.

### `get_my_leaderboard_rank(p_scope, p_metric)`
```sql
p_scope text, p_metric text DEFAULT 'streak'
RETURNS TABLE(rank, current_streak, total_attempts, total_participants)
```
Định nghĩa đầy đủ ở `supabase/sql/2026-07-15_leaderboard_streak.sql` BLOCK 5, cùng file với `get_leaderboard` (BLOCK 4). Trả hạng của **chính người gọi** dù ngoài top hiển thị của `get_leaderboard` — 0 dòng nếu chưa opt-in/không thuộc scope đó. Dùng cùng tie-break (`ORDER BY metric DESC, full_name ASC`) với `get_leaderboard` để hạng hiển thị nhất quán giữa 2 RPC. Index hỗ trợ: `idx_profiles_leaderboard` (partial, `WHERE leaderboard_opt_in AND is_active`, BLOCK 6).

> **Đã fix 2026-07-26**: RPC này (BLOCK 5) và index đi kèm (BLOCK 6) được viết cùng lúc với `get_leaderboard` (BLOCK 4) ngày 2026-07-15 nhưng **chưa từng được deploy** — chỉ BLOCK 1-4 chạy khi đó. `src/hooks/useLeaderboard.js`'s `useMyLeaderboardRank()` đã gọi RPC này vô điều kiện trên `LeaderboardPage` từ 2026-07-15, lỗi `42883 function does not exist` âm thầm (hook không đọc field `error` ra UI, người dùng chỉ thấy "hạng của bạn" không bao giờ hiện, không crash trang). Deploy qua Management API 2026-07-26, xác nhận bằng `pg_proc`/`pg_indexes`/`role_routine_grants` — cả RPC và index đã tồn tại đúng định nghĩa trên DB live.

### `reorder_questions_in_exam(p_exam_id uuid)`
```sql
RETURNS void   -- NOT security definer
```
Chuẩn hoá lại `order_index` liên tục (0,1,2...) sau khi thêm/xoá/sửa câu hỏi. Gọi từ `QuestionsPage`, `QuestionFormPage`, `questionImport.js`.

### `get_question_wrong_stats(...)`
```sql
p_min_attempts int DEFAULT 5, p_level_id uuid DEFAULT NULL, p_exam_type text DEFAULT NULL, p_question_type text DEFAULT NULL,
p_date_from timestamptz DEFAULT NULL, p_date_to timestamptz DEFAULT NULL, p_school_id text DEFAULT NULL, p_class_name text DEFAULT NULL
RETURNS TABLE(question_id, exam_id, exam_title, level_label, exam_type, exam_number, question_type, content, total_attempts, wrong_count, wrong_pct)
```
Teacher-only (raise exception nếu không phải teacher). Dùng ở `QuestionStatsPage` và `AnalyticsPage`. **4 param cuối (`p_date_from`/`p_date_to`/`p_school_id`/`p_class_name`) thêm 2026-07-14** (`2026-07-14_security_hardening.sql` BLOCK 4) — trước đó filter trường/lớp/ngày trên `AnalyticsPage` âm thầm không áp dụng cho khối "câu hay sai nhất", vẫn hiện số liệu toàn hệ thống dù UI trông như đã lọc.

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
p_date_from timestamptz DEFAULT NULL, p_date_to timestamptz DEFAULT NULL, p_pass_filter text DEFAULT NULL,
p_school_id text DEFAULT NULL, p_class_name text DEFAULT NULL
RETURNS TABLE(group_label text, total_attempts bigint, avg_score numeric, pass_pct numeric)
```
Teacher-only. Dùng ở `AnalyticsPage` → `GroupBreakdownChart`. **2 param cuối thêm 2026-07-14**, cùng lý do/cùng file với `get_question_wrong_stats` ở trên.

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

## Triggers

### `trg_update_streak_on_submit` (trên `exam_attempts`, thêm 2026-07-15)
```sql
AFTER UPDATE OF status, submitted_at ON exam_attempts
FOR EACH ROW WHEN (NEW.status IN ('submitted', 'auto_submitted') AND NEW.score IS NOT NULL)
EXECUTE FUNCTION update_streak_on_submit()
```
Tự tính `profiles.current_streak`/`longest_streak`/`last_streak_date` mỗi khi 1 `exam_attempts` chuyển sang `submitted`/`auto_submitted` **có điểm** (bài thường lẫn mock exam, không lọc `is_mock`). Gắn trên `UPDATE` chứ không phải `INSERT` vì cả `ExamPage`/`MockExamPage` đều insert attempt với `status='in_progress'` trước rồi mới update khi submit. Điều kiện `NEW.score IS NOT NULL` cố tình loại trừ đúng case "Bắt đầu lại" trên `ResumeModal` (client tự set `status='auto_submitted'` cho attempt cũ, không qua RPC, `score` vẫn NULL — xem `exam_attempts` note ở trên) để không tính nhầm 1 ngày hoạt động ảo. `FOR UPDATE` khoá dòng `profiles` khi tính, tránh race nếu 2 request submit gần như đồng thời cho cùng 1 user.

---

## Bẫy thường gặp (đã từng gây lỗi thật)

- **`profiles.school` là `text`, không phải `uuid`/FK.** Một migration trước đó (`supabase/sql/2026-07-08_six_features.sql`) từng giả định `uuid` và gây lỗi `operator does not exist: text = uuid` trên AnalyticsPage — đã fix bằng `DROP FUNCTION` + `CREATE FUNCTION` lại (đổi chữ ký tham số, không dùng `CREATE OR REPLACE` vì thay đổi kiểu tham số).
- **Bảng mua bài là `purchases`, không phải `exam_purchases`.** Bảng cấu hình thanh toán là `payment_config` (singleton, id=1), không phải `payment_settings`, và KHÔNG có cột `prices jsonb` — giá nằm ở `exams.required_amount`.
- **Không tự ý viết/sửa trực tiếp vào `purchases`/`payment_history`/`schools` (ngoại trừ RLS fallback update tên trường) từ client** — luôn qua Edge Functions (`manage-purchase`, `manage-school`) để giữ tính nhất quán (side-effect như tính `paid_amount`, kiểm tra quyền).
- **`exam_attempts` phục vụ cả bài thi thường lẫn mock exam** — phân biệt bằng `is_mock`. Đọc/ghi điểm phải chọn đúng cột: `score` (0-100, bài thường) vs `score_1000` (0-1000, mock) — nhầm cột sẽ cho ra ngưỡng pass sai (70 vs 700).
- Trước khi viết SQL/RPC mới dựa trên schema tài liệu hoá ở đây: **luôn `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '...'` để xác nhận lại**, vì schema có thể đã đổi sau lần cập nhật doc này (2026-07-10).
- **`exam_attempts` KHÔNG có RLS policy DELETE nào** (chỉ insert own / select own+teacher / update own — xem bảng RLS ở trên). Đây là chủ ý: xoá lịch sử làm bài (1 dòng, 1 student/teacher, hoặc toàn hệ thống) chỉ thực hiện qua Edge Function `manage-student` (`delete-attempt`/`clear-attempts`/`clear-all-attempts`, thêm 2026-07-13) — dùng service role, tự kiểm tra `role='teacher'` ở đầu function, KHÔNG dựa vào RLS. Client không thể tự `DELETE FROM exam_attempts` trực tiếp dù có JWT hợp lệ.
- **Các file trong `supabase/sql/` chạy tay từng block qua Supabase Studio — không có gì đảm bảo TOÀN BỘ file đã được chạy hết.** Xác nhận thật: `2026-07-15_leaderboard_streak.sql` có 6 block, nhưng chỉ BLOCK 1-4 chạy ngay lúc đó — BLOCK 5 (`get_my_leaderboard_rank`) và BLOCK 6 (`idx_profiles_leaderboard`) bị bỏ sót suốt từ 2026-07-15 đến 2026-07-26 dù code (`useLeaderboard.js`) đã gọi RPC đó vô điều kiện (đã fix, xem mục `get_my_leaderboard_rank` ở trên). Trước khi tin "file X đã chạy xong" vì đã thấy 1 RPC/bảng nó tạo ra tồn tại, kiểm tra **từng** RPC/index/bảng mà file đó định tạo, không chỉ cái đầu tiên.
- **Không tìm thấy `CREATE INDEX` nào trong `supabase/sql/` trước 2026-07-13** — các cột filter hot-path (`exam_attempts.user_id/exam_id/status/is_mock/last_activity_at`, `exam_cheat_events.attempt_id`, `questions.exam_id`, `attempt_answers.attempt_id/question_id`, `purchases.user_id`) không chắc có index trên DB thật (schema doc này reverse-engineer từ `information_schema`, không phải nguồn đầy đủ). Đã thêm `supabase/sql/2026-07-13_concurrency_indexes.sql` (dùng `CREATE INDEX CONCURRENTLY IF NOT EXISTS`, chưa chạy — cần tự chạy tay qua Supabase Studio) để bù các cột này, phục vụ tải đồng thời nhiều học sinh/giáo viên. Xác nhận bằng `SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public'` trước khi giả định đã có/chưa có.
