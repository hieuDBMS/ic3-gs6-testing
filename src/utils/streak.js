// Streak được server tính khi nộp bài (xem supabase/sql/2026-07-15_leaderboard_streak.sql),
// nhưng chỉ CẬP NHẬT lúc có bài nộp mới — nếu học sinh bỏ lỡ >1 ngày mà
// chưa nộp bài nào, `current_streak` trên profiles vẫn giữ giá trị cũ cho
// tới lần nộp bài kế tiếp. Hàm này tính lại streak "hiệu lực" ngay tại thời
// điểm đọc, để UI hiển thị đúng là chuỗi đã gãy mà không cần đợi.
export const getEffectiveStreak = (lastStreakDate, currentStreak) => {
  if (!lastStreakDate) return 0;
  const diffDays = daysSinceLastStreak(lastStreakDate);
  return diffDays <= 1 ? Number(currentStreak) || 0 : 0;
};

// Ngày dương lịch (local) đã trôi qua kể từ lastStreakDate — tách riêng vì
// dùng chung bởi getEffectiveStreak (ngưỡng "gãy hẳn") và isStreakAtRisk
// (ngưỡng "còn sống nhưng chưa làm bài hôm nay").
const daysSinceLastStreak = (lastStreakDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Parse "YYYY-MM-DD" as local-midnight components (not `new Date(str)`,
  // which parses as UTC midnight and can shift a day in negative-UTC-offset
  // timezones once compared against a local-midnight `today`).
  const [y, m, d] = String(lastStreakDate).split('-').map(Number);
  const last = new Date(y, m - 1, d);
  return Math.floor((today - last) / 86400000);
};

/**
 * true nếu học sinh đang có streak > 0 nhưng CHƯA làm bài hôm nay — tức
 * chuỗi sẽ về 0 nếu hết hôm nay vẫn không nộp bài nào. Dùng để hiển thị
 * banner nhắc nhở trên Dashboard.
 */
export const isStreakAtRisk = (lastStreakDate, currentStreak) => {
  if (!lastStreakDate || !(Number(currentStreak) > 0)) return false;
  return daysSinceLastStreak(lastStreakDate) === 1;
};
