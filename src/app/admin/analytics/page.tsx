import { Metadata } from "next";
import AdminHeader from "@/components/Admin/AdminHeader";
import { getAllViewsStats } from "@/lib/db";

import { Eye } from "lucide-react";
import AnalyticsTable from "@/components/Admin/AnalyticsTable";

export const metadata: Metadata = {
  title: "Аналитика - KMotors Admin",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  let stats: any[] = [];
  let error = null;
  let totalViews = 0;

  try {
    stats = await getAllViewsStats();
    totalViews = stats.reduce((sum, stat) => sum + (stat.view_count || 0), 0);
  } catch (err) {
    error = "Ошибка при загрузке аналитики";
    console.error(err);
  }

  const topCars = stats.slice(0, 5);
  const avgViews = stats.length > 0 ? Math.round(totalViews / stats.length) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <main className="container mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          📊 Аналитика просмотров
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
            ⚠️ {error}
          </div>
        )}

        {/* Карточки со статистикой */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Всего просмотров */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Всего просмотров
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {totalViews.toLocaleString()}
                </p>
              </div>
              <Eye className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>

          {/* Авто в каталоге */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Авто в каталоге
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.length}
                </p>
              </div>
              <span className="text-4xl">🚗</span>
            </div>
          </div>

          {/* Средние просмотры */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Средние просмотры
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {avgViews}
                </p>
              </div>
              <span className="text-4xl">📈</span>
            </div>
          </div>
        </div>

        {/* Топ 5 авто по просмотрам */}
        {topCars.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              🏆 Топ 5 авто по просмотрам
            </h2>
            <div className="space-y-3">
              {topCars.map((stat, idx) => (
                <div
                  key={stat.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-gray-400 w-8">
                      {idx === 0
                        ? "🥇"
                        : idx === 1
                        ? "🥈"
                        : idx === 2
                        ? "🥉"
                        : idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-gray-900">
                        {stat.car?.brand} {stat.car?.model}
                      </p>
                      <p className="text-sm text-gray-500">
                        {stat.car?.year} •{" "}
                        {stat.car?.price?.toLocaleString() || "N/A"} KRW
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {stat.view_count.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">просмотров</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Полная таблица всех авто */}
        {stats.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                📋 Все авто и их просмотры
              </h2>
            </div>
            <AnalyticsTable stats={stats} />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">
              📭 Пока нет данных для отображения
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
