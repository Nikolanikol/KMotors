"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DayData {
  date: string;
  sessions?: number;
  users?: number;
  visits?: number;
}

interface Props {
  data: DayData[];
  type: "ga4" | "yandex" | "orders";
  title: string;
}

function formatDate(raw: string): string {
  if (raw.length === 8) {
    // YYYYMMDD → DD.MM
    return `${raw.slice(6)}.${raw.slice(4, 6)}`;
  }
  // YYYY-MM-DD
  const parts = raw.split("-");
  if (parts.length === 3) return `${parts[2]}.${parts[1]}`;
  return raw;
}

const COLORS = {
  ga4:    { sessions: "#E37400", users: "#002C5F" },
  yandex: { visits: "#e63e25",  users: "#ff9500" },
  orders: { orders: "#10b981",  revenue: "#6366f1" },
};

export default function AnalyticsChart({ data, type, title }: Props) {
  const formatted = data.map((d) => ({ ...d, date: formatDate(d.date) }));

  const colors = COLORS[type];
  const keys = Object.keys(colors) as (keyof typeof colors)[];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-sm font-semibold text-gray-700 mb-4">{title}</div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            {keys.map((key) => (
              <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={colors[key as keyof typeof colors]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors[key as keyof typeof colors]} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          />
          {keys.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />}
          {keys.map((key) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[key as keyof typeof colors]}
              strokeWidth={2}
              fill={`url(#grad-${key})`}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
