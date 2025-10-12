"use client";

import Link from "next/link";
import { Eye, TrendingUp } from "lucide-react";

interface AnalyticsStat {
  id: string;
  car_id: string;
  view_count: number;
  last_viewed: string | null;
  car?: {
    brand: string;
    model: string;
    year: number;
    price: number;
  };
}

interface AnalyticsTableProps {
  stats: AnalyticsStat[];
}

export default function AnalyticsTable({ stats }: AnalyticsTableProps) {
  // Сортируем по просмотрам
  const sortedStats = [...stats].sort((a, b) => b.view_count - a.view_count);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPercentage = (views: number, max: number) => {
    return Math.round((views / max) * 100);
  };

  const maxViews = Math.max(...sortedStats.map((s) => s.view_count || 0), 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200">
          <tr className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
            <th className="px-6 py-4">Авто</th>
            <th className="px-6 py-4 text-center">Просмотры</th>
            <th className="px-6 py-4">Процент</th>
            <th className="px-6 py-4">Последний просмотр</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sortedStats.map((stat, idx) => {
            const percentage = getPercentage(stat.view_count || 0, maxViews);

            return (
              <tr key={stat.id} className="hover:bg-blue-50 transition">
                {/* Авто */}
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/cars/${stat.car_id}/edit`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <p>
                      {stat.car?.brand} {stat.car?.model}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stat.car?.year} •{" "}
                      {stat.car?.price?.toLocaleString() || "N/A"} KRW
                    </p>
                  </Link>
                </td>

                {/* Просмотры */}
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-lg text-gray-900">
                      {stat.view_count.toLocaleString()}
                    </span>
                  </div>
                </td>

                {/* Прогресс-бар */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-right">
                      {percentage}%
                    </span>
                  </div>
                </td>

                {/* Последний просмотр */}
                <td className="px-6 py-4 text-gray-600 text-sm">
                  {formatDate(stat.last_viewed)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
