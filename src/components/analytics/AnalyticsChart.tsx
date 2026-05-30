"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface DayData {
  date: string;
  sessions?: number;
  users?: number;
  visits?: number;
  orders?: number;
}

interface Props {
  data: DayData[];
  type: "ga4" | "yandex" | "orders";
  title: string;
}

function formatDate(raw: string): string {
  if (raw.length === 8) return `${raw.slice(6)}.${raw.slice(4, 6)}`;
  const parts = raw.split("-");
  if (parts.length === 3) return `${parts[2]}.${parts[1]}`;
  return raw;
}

const CONFIG = {
  ga4: {
    sessions: { color: "#E37400", label: "Сессии" },
    users:    { color: "#002C5F", label: "Пользователи" },
  },
  yandex: {
    visits: { color: "#e63e25", label: "Визиты" },
    users:  { color: "#ff9500", label: "Пользователи" },
  },
  orders: {
    orders: { color: "#10b981", label: "Просмотры" },
  },
} as const;

type ConfigKey = keyof typeof CONFIG;
type FieldKey<T extends ConfigKey> = keyof typeof CONFIG[T];

export default function AnalyticsChart({ data, type, title }: Props) {
  const formatted = data.map((d) => ({ ...d, date: formatDate(d.date) }));
  const cfg = CONFIG[type];
  const keys = Object.keys(cfg) as FieldKey<typeof type>[];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-sm font-semibold text-gray-700 mb-4">{title}</div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            {keys.map((key) => {
              const color = (cfg as Record<string, { color: string }>)[key as string].color;
              return (
                <linearGradient key={key as string} id={`grad-${key as string}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              );
            })}
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, key: any) => {
              const label = (cfg as Record<string, { label: string }>)[key]?.label ?? key;
              return [typeof value === "number" ? value.toLocaleString("ru") : value, label];
            }}
            labelFormatter={(label) => `📅 ${label}`}
          />
          {keys.length > 1 && (
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11 }}
              formatter={(key: string) => (cfg as Record<string, { label: string }>)[key]?.label ?? key}
            />
          )}
          {keys.map((key) => {
            const color = (cfg as Record<string, { color: string }>)[key as string].color;
            return (
              <Area
                key={key as string}
                type="monotone"
                dataKey={key as string}
                stroke={color}
                strokeWidth={2}
                fill={`url(#grad-${key as string})`}
                dot={false}
                activeDot={{ r: 4 }}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
