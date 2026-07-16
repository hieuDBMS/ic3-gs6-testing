import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

async function fetchLeaderboard({ scope, scopeValue, metric, limit }) {
  const { data, error } = await supabase.rpc('get_leaderboard', {
    p_scope: scope,
    // p_scope_value vẫn được gửi để giữ nguyên chữ ký RPC, nhưng server
    // (get_leaderboard, BLOCK 4) KHÔNG dùng giá trị này để lọc với scope
    // 'class'/'school' nữa — luôn tự lấy lớp/trường thật của người gọi từ
    // DB, tránh 1 user tự sửa request để xem leaderboard lớp/trường khác.
    p_scope_value: scopeValue || null,
    p_metric: metric,
    p_limit: limit,
  });
  if (error) throw error;
  return data || [];
}

async function fetchMyRank({ scope, metric }) {
  const { data, error } = await supabase.rpc('get_my_leaderboard_rank', {
    p_scope: scope,
    p_metric: metric,
  });
  if (error) throw error;
  return data?.[0] || null;
}

/**
 * Bảng xếp hạng (opt-in) theo streak hoặc số bài đã hoàn thành, phạm vi
 * lớp/trường/toàn hệ thống — xem RPC get_leaderboard trong
 * supabase/sql/2026-07-15_leaderboard_streak.sql.
 */
export const useLeaderboard = ({ scope, scopeValue, metric, limit = 50, enabled = true }) => {
  const { data: rows = [], isLoading, error, refetch } = useQuery({
    queryKey: ['leaderboard', scope, scopeValue, metric, limit],
    queryFn: () => fetchLeaderboard({ scope, scopeValue, metric, limit }),
    enabled,
  });

  return { rows, loading: isLoading, error, refetch };
};

/**
 * Hạng của chính user hiện tại trong scope/metric đang xem, kể cả khi họ
 * không nằm trong top hiển thị của useLeaderboard — xem RPC
 * get_my_leaderboard_rank trong supabase/sql/2026-07-15_leaderboard_streak.sql.
 * `data` là null nếu user chưa opt-in / không thuộc scope đó (0 dòng trả về).
 */
export const useMyLeaderboardRank = ({ scope, metric, enabled = true }) => {
  const { data: myRank = null, isLoading, refetch } = useQuery({
    queryKey: ['leaderboard-my-rank', scope, metric],
    queryFn: () => fetchMyRank({ scope, metric }),
    enabled,
  });

  return { myRank, loading: isLoading, refetch };
};
