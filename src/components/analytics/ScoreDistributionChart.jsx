import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PASS_THRESHOLD } from '../../utils/scoreUtils';

// Status colors reused from ResultPage's own pass/fail convention — not a new palette.
const PASS_COLOR = '#10b981'; // emerald-500
const FAIL_COLOR = '#f43f5e'; // rose-500

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 dark:text-slate-300">Điểm {label}</p>
      <p className="text-gray-500 dark:text-slate-500 mt-0.5">{payload[0].value} lượt làm</p>
    </div>
  );
};

export const ScoreDistributionChart = ({ data }) => {
  if (!data?.length) {
    return <div className="flex items-center justify-center h-64 text-sm text-gray-400 dark:text-slate-500">Chưa có dữ liệu</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="bucket_label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
        <Bar dataKey="attempt_count" radius={[4, 4, 0, 0]} maxBarSize={44}>
          {data.map((d) => (
            <Cell key={d.bucket_min} fill={d.bucket_min >= PASS_THRESHOLD ? PASS_COLOR : FAIL_COLOR} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
