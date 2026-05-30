"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface Props {
  data: { hour: number; visits: number }[];
  color?: string;
  title: string;
}

export default function HoursChart({ data, color = "#E37400", title }: Props) {
  const sorted = [...data.map(d => d.visits)].sort((a, b) => a - b);
  const p95idx = Math.floor(sorted.length * 0.95);
  const softMax = Math.max(sorted[p95idx] ?? 1, 1);
  const peak = data.reduce((a, b) => b.visits > a.visits ? b : a, data[0]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-sm font-semibold text-gray-700 mb-1">{title}</div>
      {peak?.visits > 0 && (
        <div className="text-xs text-orange-600 mb-3">
          Пик активности: {peak.hour}:00 — {peak.visits} визитов
        </div>
      )}
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={data} margin={{ top: 2, right: 0, left: -30, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(h) => h % 6 === 0 ? `${h}:00` : ""}
          />
          <YAxis hide domain={[0, softMax]} />
          <Tooltip
            formatter={(v) => [`${v} визитов`, ""]}
            labelFormatter={(h) => `${h}:00`}
            contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #e5e7eb" }}
          />
          <Bar dataKey="visits" radius={[3, 3, 0, 0]}>
            {data.map((d) => (
              <Cell
                key={d.hour}
                fill={d.hour === peak?.hour && d.visits > 0 ? "#E37400" : color}
                opacity={d.visits === 0 ? 0.15 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
