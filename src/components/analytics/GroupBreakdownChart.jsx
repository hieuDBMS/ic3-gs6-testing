import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';
import { PASS_THRESHOLD } from '../../utils/scoreUtils';

const PASS_COLOR = '#10b981'; // emerald-500
const FAIL_COLOR = '#f43f5e'; // rose-500

const CustomTooltip = ({ active, payload, label }) => {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg px-3 py-2 text-xs space-y-0.5">
      <p className="font-semibold text-gray-700 dark:text-slate-300">{label}</p>
      <p className="text-gray-500 dark:text-slate-500">{t('groupBreakdownChart.avgScoreLabel')} <span className="font-semibold text-gray-700 dark:text-slate-300">{d.avg_score}</span></p>
      <p className="text-gray-500 dark:text-slate-500">{t('groupBreakdownChart.passRateLabel')} <span className="font-semibold text-gray-700 dark:text-slate-300">{d.pass_pct}%</span></p>
      <p className="text-gray-500 dark:text-slate-500">{t('groupBreakdownChart.attemptsCount', { count: d.total_attempts })}</p>
    </div>
  );
};

export const GroupBreakdownChart = ({ data }) => {
  const { t } = useTranslation();
  if (!data?.length) {
    return <div className="flex items-center justify-center h-64 text-sm text-gray-400 dark:text-slate-500">{t('groupBreakdownChart.noData')}</div>;
  }
  const height = Math.max(200, data.length * 40);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke="#f1f5f9" />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
        <YAxis dataKey="group_label" type="category" width={120} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
        <Bar dataKey="avg_score" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data.map((d) => (
            <Cell key={d.group_label} fill={d.avg_score >= PASS_THRESHOLD ? PASS_COLOR : FAIL_COLOR} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
