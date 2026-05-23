# REQUIREMENT.MD — IC3 Exam Platform

## 1. Project Overview

Xây dựng nền tảng thi trực tuyến IC3 (Internet and Computing Core Certification) sử dụng **ReactJS** + **Supabase**. Hệ thống hỗ trợ hai vai trò người dùng: **Student** và **Teacher**, với đầy đủ chức năng làm bài, quản lý câu hỏi, và theo dõi lịch sử.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | ReactJS (latest stable — v18.x) |
| Styling | Tailwind CSS v3.x |
| Backend / Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Storage | Supabase Storage (ảnh câu hỏi / đáp án) |
| State Management | React Context API + useState/useReducer |
| Routing | React Router v6 |
| Database setup | Supabase MCP (tạo toàn bộ bảng qua MCP) |

---

## 3. User Roles & Permissions

### 3.1 Student
- Đăng nhập / Đăng xuất
- Làm bài thi (Testing & Gmetrix) theo từng Level
- Xem kết quả sau khi nộp bài
- Xem lịch sử làm bài cá nhân (Dashboard)
- **Không** được thêm / sửa / xoá câu hỏi

### 3.2 Teacher
- Đăng nhập / Đăng xuất
- Làm bài thi (tất cả quyền của Student)
- Thêm / Sửa / Xoá câu hỏi
- Upload ảnh cho câu hỏi và đáp án
- Xem Dashboard cá nhân
- Quản lý toàn bộ ngân hàng câu hỏi theo Level / Loại bài
- **Tạo / Sửa / Xoá tài khoản Student** (không thể tác động lên tài khoản Teacher khác)
- **Xem tiến độ làm bài của tất cả Student**: lịch sử, điểm số, thời gian, từng bài thi

---

## 4. IC3 Exam Structure

### 4.1 Cấu trúc cấp độ

Hệ thống tổ chức theo cấu trúc phân cấp:

```
IC3 GS6
├── Level 1
│   ├── Testing 1
│   ├── Testing 2
│   ├── Testing 3
│   ├── Gmetrix 1
│   └── Gmetrix 2
├── Level 2
│   ├── Testing 1
│   ├── Testing 2
│   ├── Testing 3
│   ├── Testing 4
│   ├── Testing 5
│   ├── Gmetrix 1
│   └── Gmetrix 2
└── Level 3
    ├── Testing 1
    ├── Testing 2
    ├── Testing 3
    ├── Testing 4
    ├── Testing 5
    ├── Gmetrix 1
    └── Gmetrix 2
```

> Cấu trúc này có thể mở rộng thêm các phiên bản IC3 khác (GS5, GS7...) trong tương lai.

### 4.2 Loại câu hỏi (Question Types)

| Type | Mô tả |
|---|---|
| `choice` | Chọn một đáp án đúng trong nhiều lựa chọn (Single choice) |
| `multi` | Chọn nhiều đáp án đúng (Multiple choice) |
| `dragdrop` | Kéo thả thực sự (HTML5 DnD) — pool các item trên cùng, kéo vào drop zone (cột/nhóm) tương ứng bên dưới. Hỗ trợ click-to-place trên mobile. |
| `truefalse` | Đúng/Sai — một câu dẫn kèm nhiều nhận định, học sinh chọn Đúng hoặc Sai cho từng nhận định bằng button. Tính điểm all-or-nothing: chỉ đúng khi tất cả nhận định được trả lời đúng. |

---

## 5. Pages & Features

### 5.1 Trang Login (`/login`)

- Form đăng nhập với Email + Password
- Supabase Auth xác thực
- Sau khi đăng nhập, redirect theo role:
  - Student → `/dashboard`
  - Teacher → `/dashboard`
- Hiển thị thông báo lỗi chung khi sai thông tin (không phân biệt sai email hay sai password)
- UI đẹp, responsive, thân thiện
- HTTPS tự động qua Vercel

---

### 5.2 Trang Dashboard (`/dashboard`)

#### Dashboard — Student
- Tổng số bài đã làm
- Điểm trung bình
- Lịch sử làm bài cá nhân (bảng hoặc danh sách):
  - Tên bài thi (Level / Loại bài / Số thứ tự)
  - Ngày giờ làm
  - Số câu đúng / Tổng số câu
  - Điểm (%)
  - Thời gian làm bài
  - Nút "Xem kết quả chi tiết"
- Biểu đồ tiến trình theo từng Level (tùy chọn)
- Responsive trên mọi thiết bị

#### Dashboard — Teacher
Ngoài lịch sử làm bài cá nhân, Teacher còn thấy thêm:
- **Bảng tổng quan tất cả Student**:
  - Danh sách student (tên, email)
  - Tổng số bài đã làm
  - Điểm trung bình
  - Bài gần nhất + thời gian làm
  - Nút "Xem chi tiết tiến độ" của từng student
- **Trang tiến độ chi tiết từng Student** (`/teacher/students/:studentId`):
  - Thông tin student (tên, email)
  - Toàn bộ lịch sử làm bài: bài thi, điểm, thời gian, ngày nộp
  - Thống kê theo Level: % hoàn thành, điểm TB từng level
  - Nút xem kết quả chi tiết từng lần thi
- Bộ lọc: lọc theo tên student, theo Level, theo khoảng thời gian
- Responsive trên mọi thiết bị

---

### 5.3 Trang chọn bài thi (`/exam`)

- Hiển thị cấu trúc IC3 theo Level (accordion hoặc card)
- Mỗi Level hiển thị danh sách bài Testing và Gmetrix
- Nút "Bắt đầu làm bài" → chuyển sang trang làm bài
- Responsive, dễ dùng trên điện thoại

---

### 5.4 Trang làm bài (`/exam/:examId`)

**Core feature — phải hoàn chỉnh và UX tốt.**

Tính năng:
- **Đồng hồ đếm ngược** hiển thị thời gian còn lại (cấu hình thời gian theo từng loại bài)
- Hiển thị từng câu hỏi:
  - Nội dung câu hỏi (text)
  - Hình ảnh câu hỏi (nếu có)
  - Danh sách đáp án (kèm ảnh nếu có)
- Hỗ trợ 3 loại câu hỏi:
  - **`choice`**: Chọn một đáp án (radio), đáp án hiển thị kèm ảnh nếu có
  - **`multi`**: Chọn nhiều đáp án (checkbox)
  - **`dragdrop`**: Kéo thả thực sự (HTML5 DnD):
    - Pool các drag item (có ảnh + text) hiển thị phía trên
    - Các drop zone (cột/nhóm) hiển thị phía dưới — tên cột lấy từ `drop_content`
    - Kéo item từ pool vào đúng cột; có thể kéo ra pool lại để đổi
    - Trên mobile: bấm chọn item → bấm vào cột để đặt vào (click-to-place)
    - Hiển thị ảnh drop zone nếu có
- Thanh điều hướng câu hỏi (Question Navigator):
  - Nhảy nhanh đến câu bất kỳ
  - Màu sắc phân biệt: Chưa làm / Đã chọn / Đã đánh dấu
- Nút "Đánh dấu để xem lại"
- Nút "Nộp bài" → hiển thị confirm dialog trước khi nộp
- Tự động nộp khi hết giờ
- Lưu kết quả vào database sau khi nộp
- Responsive trên mọi thiết bị

---

### 5.5 Trang kết quả (`/exam/:examId/result`)

Hiển thị sau khi nộp bài:
- Điểm tổng (số câu đúng / tổng câu, %) — gradient banner xanh (passed) / đỏ (failed), ngưỡng đạt là 70%
- Thời gian làm bài
- Ngày giờ nộp bài
- Chi tiết từng câu:
  - Câu hỏi + ảnh câu hỏi (nếu có)
  - Với **choice/multi**: hiển thị từng đáp án, phân biệt: Đầp án đúng / Thí sinh chọn sai / Thí sinh chọn đúng
  - Với **dragdrop**: hiển thị từng drag item, zone thí sinh xếp vào vs zone đúng, kèm ảnh
  - Trạng thái: Đúng ✓ / Sai ✗ / Bỏ qua
- Nút "Về Dashboard" và "Làm lại bài này"
- UI rõ ràng, thân thiện

---

### 5.6 Trang quản lý câu hỏi (`/questions`) — **Teacher only**

**Chỉ Teacher mới truy cập được.** Student truy cập sẽ bị redirect.

Tính năng:
- Danh sách câu hỏi với bộ lọc:
  - Lọc theo Level (Level 1, 2, 3...)
  - Lọc theo Loại bài (Testing / Gmetrix)
  - Lọc theo Số bài (Testing 1, Testing 2...)
  - Lọc theo Loại câu hỏi (choice, multi, dragdrop)
  - Tìm kiếm theo nội dung
- Bảng hiển thị câu hỏi: nội dung, loại, level, hình ảnh (thumbnail)
- Nút Thêm / Sửa / Xoá câu hỏi
- **Modal Thêm/Sửa câu hỏi:**
  - Chọn Level, Loại bài (Testing/Gmetrix), Số thứ tự bài, Thứ tự câu
  - Chọn Loại câu hỏi (choice / multi / dragdrop)
  - Nhập nội dung câu hỏi
  - Upload ảnh cho câu hỏi (bucket: `question-images`)
  - Thêm các đáp án (dynamic) — cho `choice` / `multi`:
    - Nội dung đáp án
    - Upload ảnh cho đáp án (bucket: `answer-images`)
    - Radio/Checkbox đánh dấu đáp án đúng
  - Đối với `dragdrop`: editor dạng card 2 cột:
    - **Mục Kéo (Drag)**: nội dung text + upload ảnh (bucket: `question-images`)
    - **Mục Thả (Drop)**: nội dung text + upload ảnh (bucket: `answer-images`)
    - Có thể thêm nhiều cặp kéo-thả
  - Xem trước (Preview) câu hỏi — hiển thị ảnh kéo/thả trong preview
- Xoá câu hỏi với confirm dialog
- Responsive

---

### 5.7 Trang quản lý Student (`/teacher/students`) — **Teacher only**

**Chỉ Teacher mới truy cập được.** Student truy cập sẽ bị redirect.

Tính năng:
- Danh sách toàn bộ student: tên, email, ngày tạo, số bài đã làm, điểm TB
- Tìm kiếm student theo tên / email
- **Tạo tài khoản Student mới:**
  - Modal nhập: Họ tên, Email, Mật khẩu tạm thời
  - Tự động gán role = `student`
  - Gọi qua Supabase Edge Function để không lộ service key ở client
- **Sửa thông tin Student:**
  - Cập nhật họ tên
  - Reset mật khẩu (set mật khẩu mới)
- **Xoá tài khoản Student:**
  - Confirm dialog trước khi xoá
  - Xoá user khỏi Supabase Auth và bảng `profiles`
  - **Không thể xoá tài khoản Teacher**
- Nút "Xem tiến độ" → chuyển sang `/teacher/students/:studentId`
- Responsive

---

## 6. Database Schema (Supabase — tạo qua MCP)

### 6.1 Bảng `profiles`
```sql
id              uuid PRIMARY KEY REFERENCES auth.users(id)
email           text NOT NULL
full_name       text
role            text NOT NULL CHECK (role IN ('student', 'teacher'))
created_by      uuid REFERENCES profiles(id)  -- Teacher đã tạo student này (nullable)
is_active       boolean NOT NULL DEFAULT true
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### 6.2 Bảng `exam_levels`
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
version      text NOT NULL        -- e.g. 'GS6', 'GS5'
level_number int NOT NULL         -- 1, 2, 3...
label        text NOT NULL        -- e.g. 'Level 1'
created_at   timestamptz DEFAULT now()
```

### 6.3 Bảng `exams`
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
level_id         uuid REFERENCES exam_levels(id)
exam_type        text NOT NULL CHECK (exam_type IN ('testing', 'gmetrix'))
exam_number      int NOT NULL
title            text NOT NULL
duration_seconds int NOT NULL
created_at       timestamptz DEFAULT now()
```

### 6.4 Bảng `questions`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
exam_id         uuid REFERENCES exams(id)
question_type   text NOT NULL CHECK (question_type IN ('choice', 'multi', 'dragdrop'))
content         text NOT NULL
image_url       text
order_index     int NOT NULL DEFAULT 0
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### 6.5 Bảng `answers`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
question_id     uuid REFERENCES questions(id) ON DELETE CASCADE
content         text NOT NULL
image_url       text
is_correct      boolean NOT NULL DEFAULT false
order_index     int NOT NULL DEFAULT 0
created_at      timestamptz DEFAULT now()
```

### 6.6 Bảng `dragdrop_pairs`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
question_id     uuid REFERENCES questions(id) ON DELETE CASCADE
drag_content    text NOT NULL
drag_image_url  text          -- ảnh cho mục kéo (Drag), nullable
drop_content    text NOT NULL -- tên nhóm/cột drop zone
drop_image_url  text          -- ảnh cho nhóm drop zone, nullable
order_index     int NOT NULL DEFAULT 0
```

> **Ghi chú thiết kế DragDrop:** Các `drop_content` trùng nhau = cùng một drop zone. Ví dụ nhiều pairs có `drop_content = 'NHẬP'` → tất cả drag items đó phải kéo vào cột "NHẬP".

### 6.7 Bảng `truefalse_statements`
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
question_id  uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE
content      text NOT NULL       -- Nội dung nhận định
is_true      boolean NOT NULL DEFAULT true  -- Đáp án đúng: đúng hay sai
order_index  int NOT NULL DEFAULT 0
created_at   timestamptz DEFAULT now()
```

> **Ghi chú:** `dragdrop_response` trong bảng `attempt_answers` được tái sử dụng để lưu response của truefalse dưới dạng `{ [statement_id]: true | false }`. Câu truefalse tính điểm **all-or-nothing**: chỉ đúng khi tất cả nhận định được trả lời đúng.

### 6.7 Bảng `exam_attempts`
```sql
id                 uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id            uuid REFERENCES profiles(id)
exam_id            uuid REFERENCES exams(id)
started_at         timestamptz NOT NULL DEFAULT now()
submitted_at       timestamptz
time_spent_seconds int
score              numeric(5,2)
total_questions    int NOT NULL
correct_count      int NOT NULL DEFAULT 0
status             text NOT NULL CHECK (status IN ('in_progress', 'submitted', 'auto_submitted'))
created_at         timestamptz DEFAULT now()
```

### 6.8 Bảng `attempt_answers`
```sql
id                   uuid PRIMARY KEY DEFAULT gen_random_uuid()
attempt_id           uuid REFERENCES exam_attempts(id) ON DELETE CASCADE
question_id          uuid REFERENCES questions(id)
selected_answer_ids  uuid[]
dragdrop_response    jsonb
is_correct           boolean
created_at           timestamptz DEFAULT now()
```

---

## 7. Row Level Security (RLS)

### Nguyên tắc:
- **Mọi bảng đều bật RLS**
- User chỉ đọc/ghi được dữ liệu của chính mình
- Teacher có thêm quyền quản lý câu hỏi và xem dữ liệu của student
- Tạo/xoá user Auth chỉ thực hiện qua Edge Function (server-side)

### Policies cần tạo:

| Bảng | Policy | Điều kiện |
|---|---|---|
| `profiles` | SELECT (own) | `auth.uid() = id` |
| `profiles` | SELECT (students — teacher) | caller role = `'teacher'` và target role = `'student'` |
| `profiles` | UPDATE (own) | `auth.uid() = id` |
| `profiles` | UPDATE (student — teacher) | caller role = `'teacher'` và target role = `'student'` |
| `profiles` | DELETE (student — teacher) | caller role = `'teacher'` và target role = `'student'` |
| `exam_attempts` | SELECT (own) | `auth.uid() = user_id` |
| `exam_attempts` | SELECT (teacher) | caller role = `'teacher'` |
| `exam_attempts` | INSERT | `auth.uid() = user_id` |
| `exam_attempts` | UPDATE | `auth.uid() = user_id` |
| `attempt_answers` | SELECT (own) | attempt thuộc về user hiện tại |
| `attempt_answers` | SELECT (teacher) | caller role = `'teacher'` |
| `attempt_answers` | INSERT | attempt thuộc về user hiện tại |
| `questions` | SELECT | authenticated users |
| `questions` | INSERT/UPDATE/DELETE | role = `'teacher'` |
| `answers` | SELECT | authenticated users |
| `answers` | INSERT/UPDATE/DELETE | role = `'teacher'` |
| `dragdrop_pairs` | SELECT | authenticated users |
| `dragdrop_pairs` | INSERT/UPDATE/DELETE | role = `'teacher'` |
| `exams` | SELECT | authenticated users |
| `exam_levels` | SELECT | authenticated users |

---

## 8. Supabase Edge Functions

### `manage-student` Edge Function
Dùng để Teacher tạo / xoá tài khoản Student mà không lộ service role key ở client.

**Endpoint**: `POST /functions/v1/manage-student`

| Action | Mô tả |
|---|---|
| `create` | Tạo user mới trong Supabase Auth + insert vào `profiles` với role = `student` |
| `delete` | Xoá user khỏi Supabase Auth + xoá profile |
| `reset-password` | Đặt lại mật khẩu cho student |

**Bảo mật:**
- Verify JWT của request → chỉ Teacher mới được gọi
- Kiểm tra role trong DB trước khi thực hiện
- Không cho phép xoá / sửa tài khoản có role = `'teacher'`

---

## 9. Supabase Storage

- Bucket: `question-images` — ảnh câu hỏi + ảnh mục Kéo (drag items)
- Bucket: `answer-images` — ảnh đáp án + ảnh mục Thả (drop zones)
- Cả 2 bucket: public read, authenticated write
- Chỉ Teacher được upload (enforce bằng Storage RLS policy)
- Hỗ trợ định dạng: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- Giới hạn kích thước: 5MB mỗi ảnh
- Tên file đổi thành UUID ngẫu nhiên khi upload (không giữ tên gốc)

---

## 10. Security — Cơ bản

Chỉ áp dụng các biện pháp bảo mật thiết yếu, phù hợp với quy mô dự án:

### 10.1 Authentication
- Dùng Supabase Auth — không tự xây hệ thống auth
- Chỉ bật provider Email/Password, tắt các provider không dùng
- Mật khẩu tối thiểu 8 ký tự (enforce khi Teacher tạo/reset)
- HTTPS tự động qua Vercel — mọi request đều được mã hoá
- JWT session do Supabase quản lý, tự động expire và refresh

### 10.2 Phân quyền
- Mọi bảng đều bật RLS — user chỉ truy cập được dữ liệu của mình
- Phân quyền thực thi ở server (RLS + Edge Function), không dựa vào client
- Route Teacher-only được bảo vệ bằng `ProtectedRoute` component ở frontend
- Service Role Key chỉ dùng trong Edge Function, không để ở frontend hoặc commit lên Git

### 10.3 Input & File Upload
- React tự escape HTML trong JSX — không dùng `dangerouslySetInnerHTML`
- Supabase SDK dùng parameterized queries — không có SQL Injection
- File upload: chỉ cho phép đúng định dạng ảnh, giới hạn 5MB
- Tên file upload đổi thành UUID — không giữ tên file gốc

### 10.4 Bảo vệ dữ liệu thi
- Field `is_correct` trong bảng `answers` **không trả về client** khi đang làm bài — chỉ gửi sau khi `status = submitted`
- Không log đáp án đúng ra console trong môi trường production
- File `.env` được thêm vào `.gitignore`, không commit lên Git

---

## 11. UI/UX Requirements

- **Responsive**: Hoạt động tốt trên mobile (360px+), tablet, laptop, desktop
- **Design system**: Tailwind CSS với custom color palette nhất quán
- **Animations**: Transition mượt mà, loading states rõ ràng
- **Feedback**: Toast notifications cho các hành động (lưu, xoá, lỗi...)
- **Loading**: Skeleton loading khi fetch data
- **Empty states**: Hiển thị thân thiện khi không có dữ liệu
- **Error handling**: Xử lý và hiển thị lỗi rõ ràng cho người dùng
- **Accessibility**: Contrast tốt, keyboard navigable, alt text cho ảnh
- **Fonts**: Google Fonts — chọn font phù hợp với giao diện học thuật
- **Icons**: Lucide React hoặc Heroicons

---

## 12. Project Structure (gợi ý)

```
src/
├── components/
│   ├── auth/
│   │   └── LoginForm.jsx
│   ├── exam/
│   │   ├── ExamCard.jsx
│   │   ├── QuestionRenderer.jsx
│   │   ├── QuestionNavigator.jsx
│   │   ├── Timer.jsx
│   │   ├── ChoiceQuestion.jsx
│   │   ├── MultiQuestion.jsx
│   │   └── DragDropQuestion.jsx
│   ├── questions/
│   │   ├── QuestionModal.jsx
│   │   ├── AnswerEditor.jsx
│   │   └── ImageUploader.jsx
│   ├── students/
│   │   ├── StudentTable.jsx
│   │   ├── StudentModal.jsx
│   │   └── StudentProgressDetail.jsx
│   ├── dashboard/
│   │   ├── AttemptHistoryTable.jsx
│   │   └── StudentOverviewTable.jsx
│   └── shared/
│       ├── Navbar.jsx
│       ├── ProtectedRoute.jsx
│       ├── Toast.jsx
│       └── SkeletonLoader.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx
│   ├── ExamListPage.jsx
│   ├── ExamPage.jsx
│   ├── ResultPage.jsx
│   ├── QuestionsPage.jsx          ← Teacher only
│   ├── StudentManagementPage.jsx  ← Teacher only
│   └── StudentProgressPage.jsx    ← Teacher only
├── context/
│   ├── AuthContext.jsx
│   └── ExamContext.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useExam.js
│   ├── useStudents.js
│   └── useTimer.js
├── lib/
│   └── supabase.js
├── utils/
│   ├── scoreCalculator.js
│   └── timeFormatter.js
└── App.jsx
supabase/
└── functions/
    └── manage-student/
        └── index.ts
```

---

## 13. Environment Variables

```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> ⚠️ Không commit file `.env` lên Git. Thêm vào `.gitignore`.

---

## 14. Setup Instructions

### Bước 1: Tạo project Supabase
1. Tạo project mới tại [supabase.com](https://supabase.com)
2. Lấy `Project URL` và `anon key`
3. Tắt các auth provider không dùng (chỉ giữ Email/Password)

### Bước 2: Tạo database qua Supabase MCP
- Tạo toàn bộ các bảng theo schema ở mục 6
- Tạo RLS policies theo mục 7
- Tạo Storage buckets theo mục 9
- Deploy Edge Function `manage-student` theo mục 8

### Bước 3: Khởi tạo ReactJS project
```bash
npx create-react-app ic3-exam-platform
cd ic3-exam-platform
npm install @supabase/supabase-js react-router-dom tailwindcss
npx tailwindcss init
```

### Bước 4: Cấu hình Tailwind
Cập nhật `tailwind.config.js` và thêm directives vào `index.css`

### Bước 5: Seed dữ liệu mẫu
- **Đã seed** `exam_levels`: GS6 Level 1, 2, 3
- **Đã seed** `exams` (19 bài tổng):
  - Level 1: Testing 1-3, Gmetrix 1-2
  - Level 2: Testing 1-5, Gmetrix 1-2
  - Level 3: Testing 1-5, Gmetrix 1-2
- Tạo 1 tài khoản Teacher mặc định trực tiếp trong Supabase Auth Dashboard

---

## 15. Non-Functional Requirements

- **Performance**: Load time < 3s trên 4G
- **Security**: Xem mục 10 — áp dụng các biện pháp cơ bản, thiết yếu
- **Scalability**: Schema hỗ trợ mở rộng thêm phiên bản IC3 mới (GS5, GS7...)
- **Browser support**: Chrome, Firefox, Safari, Edge (2 phiên bản mới nhất)
- **Session management**: Dùng Supabase built-in session, không tự quản lý token

---

*Tài liệu này là yêu cầu hoàn chỉnh để xây dựng IC3 Exam Platform. Mọi tính năng, bảng dữ liệu, và policy cần được triển khai đầy đủ trước khi launch.*

---

## 16. Changelog

> Các thay đổi so với yêu cầu gốc, được cập nhật trong quá trình phát triển.

### 2026-05-02

#### Database
- **`dragdrop_pairs`**: Thêm 2 cột mới:
  - `drag_image_url text` — ảnh cho mục Kéo
  - `drop_image_url text` — ảnh cho mục Thả (drop zone)
- **Seed data**: Đã insert sẵn 3 `exam_levels` (GS6 Level 1-3) và 19 `exams` vào DB

#### Giao diện Thêm/Sửa câu hỏi (`QuestionModal`)
- Drag-drop editor đổi thành dạng **card 2 cột**: mỗi cặp có ImageUploader riêng cho cả Drag và Drop side
- Mục Kéo dùng bucket `question-images`; Mục Thả dùng bucket `answer-images`
- Thêm trường **Thứ tự câu** (`order_index`) vào modal
- Preview hiển thị ảnh drag/drop

#### Giao diện Làm bài (`QuestionRenderer` — dragdrop)
- **Đổi hoàn toàn** từ dropdown select → **kéo thả thực sự (HTML5 DnD)**:
  - Pool các drag item (kèm ảnh) hiển thị ở trên
  - Drop zone (cột nhóm) hiển thị ở dưới
  - Kéo thả trên desktop; click-to-place trên mobile
  - Items đã xếp có thể click để trả về pool
  - Nút “Làm lại” để reset toàn bộ
  - Progress counter: “Đã xếp X / Y mục”

#### Trang Kết quả (`ResultPage`)
- Viết lại hoàn toàn UI:
  - Gradient score banner (xanh/đỏ)
  - Choice/multi: hiển thị từng đáp án với trạng thái màu rõ ràng + nhãn “Bạn chọn” / “Đáp án đúng”
  - Dragdrop: hiển thị drag item (kèm ảnh), zone bạn chọn, zone đúng (nếu sai)
  - Nút “Làm lại bài này” điều hướng đúng exam_id

#### Storage
- Xác định rõ bucket usage: `question-images` cho câu hỏi + drag items; `answer-images` cho đáp án + drop zones

---

### 2026-05-22

#### Thêm loại câu hỏi True/False (`truefalse`)
- **Database**: Thêm bảng `truefalse_statements` và cập nhật CHECK constraint trên `questions.question_type`.
- **QuestionModal**: Thêm editor truefalse với toggle Đúng/Sai cho từng nhận định, validate ít nhất 2 nhận định, save vào `truefalse_statements`.
- **QuestionRenderer**: Thêm component `TrueFalseQuestion` hiển thị từng nhận định với 2 nút chọn Đúng/Sai, feedback màu sắc theo lựa chọn.
- **ExamPage**: Fetch `truefalse_statements` cùng với questions, chấm điểm **all-or-nothing** (tất cả đúng = 1 điểm, sai 1 = 0 điểm).
- **ResultPage**: Hiển thị kết quả từng nhận định với đáp án học sinh chọn và đáp án đúng.
- **QuestionsPage**: Thêm badge "Đúng / Sai", filter, hiển thị số nhận định trong danh sách câu hỏi.
