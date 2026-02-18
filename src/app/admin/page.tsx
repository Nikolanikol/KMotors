import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Типы данных
interface PageStat {
  path: string;
  count: number;
}

interface SourceStat {
  referrer: string;
  count: number;
}

interface DayStat {
  date: string;
  count: number;
}

// Форматирование имени страницы
function formatPath(path: string): string {
  if (path === "/") return "🏠 Главная";
  if (path === "/catalog") return "🚗 Каталог";
  if (path === "/blog") return "📰 Блог";
  if (path === "/buy") return "📋 Как купить";
  if (path === "/contact") return "📞 Контакты";
  if (path === "/parts") return "🔧 Запчасти";
  if (path.startsWith("/blog/")) return `📄 ${path.replace("/blog/", "")}`;
  if (path.startsWith("/catalog/")) return `🚘 Авто #${path.replace("/catalog/", "")}`;
  return path;
}

// Форматирование источника
function formatSource(source: string): string {
  const map: Record<string, string> = {
    direct: "🔗 Прямые переходы",
    google: "🔍 Google",
    yandex: "🔍 Яндекс",
    telegram: "✈️ Telegram",
    instagram: "📸 Instagram",
    vk: "💙 ВКонтакте",
    facebook: "👤 Facebook",
  };
  return map[source] || `🌐 ${source}`;
}

// Форматирование даты
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export default async function AdminPage() {
  // Дополнительная проверка на сервере
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session");
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!sessionCookie || sessionCookie.value !== adminPassword) {
    redirect("/admin/login");
  }

  const supabase = createServerClient();

  const now = new Date();
  const days7ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const days30ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const days14ago = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

  // Загружаем все данные параллельно
  const [
    { count: total7 },
    { count: total30 },
    { data: topPages7 },
    { data: sources30 },
    { data: dailyRaw },
  ] = await Promise.all([
    // Всего за 7 дней
    supabase
      .from("page_views")
      .select("*", { count: "exact", head: true })
      .gte("created_at", days7ago),

    // Всего за 30 дней
    supabase
      .from("page_views")
      .select("*", { count: "exact", head: true })
      .gte("created_at", days30ago),

    // Топ страниц за 7 дней
    supabase
      .from("page_views")
      .select("path")
      .gte("created_at", days7ago),

    // Источники за 30 дней
    supabase
      .from("page_views")
      .select("referrer")
      .gte("created_at", days30ago),

    // Данные за 14 дней для графика по дням
    supabase
      .from("page_views")
      .select("created_at")
      .gte("created_at", days14ago)
      .order("created_at", { ascending: true }),
  ]);

  // Агрегируем топ страниц
  const pageMap: Record<string, number> = {};
  (topPages7 || []).forEach((row) => {
    pageMap[row.path] = (pageMap[row.path] || 0) + 1;
  });
  const topPages: PageStat[] = Object.entries(pageMap)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Агрегируем источники
  const sourceMap: Record<string, number> = {};
  (sources30 || []).forEach((row) => {
    const s = row.referrer || "direct";
    sourceMap[s] = (sourceMap[s] || 0) + 1;
  });
  const totalSourceCount = Object.values(sourceMap).reduce((a, b) => a + b, 0);
  const sources: SourceStat[] = Object.entries(sourceMap)
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count);

  // Агрегируем по дням
  const dayMap: Record<string, number> = {};
  // Инициализируем последние 14 дней нулями
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dayMap[key] = 0;
  }
  (dailyRaw || []).forEach((row) => {
    const key = row.created_at.slice(0, 10);
    dayMap[key] = (dayMap[key] || 0) + 1;
  });
  const dailyStats: DayStat[] = Object.entries(dayMap).map(([date, count]) => ({
    date,
    count,
  }));
  const maxDayCount = Math.max(...dailyStats.map((d) => d.count), 1);

  const uniquePages = Object.keys(pageMap).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="bg-[#002C5F] text-white px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-lg font-bold">KMotors Admin</div>
          <div className="text-xs text-blue-200">Аналитика посещений</div>
        </div>
        <a
          href="/"
          className="text-xs text-blue-200 hover:text-white transition-colors"
        >
          ← На сайт
        </a>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Итоговые цифры */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-2xl font-bold text-[#002C5F]">
              {(total7 || 0).toLocaleString("ru")}
            </div>
            <div className="text-sm text-gray-500 mt-1">Визитов за 7 дней</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-2xl font-bold text-[#002C5F]">
              {(total30 || 0).toLocaleString("ru")}
            </div>
            <div className="text-sm text-gray-500 mt-1">Визитов за 30 дней</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-2xl font-bold text-[#002C5F]">{uniquePages}</div>
            <div className="text-sm text-gray-500 mt-1">Уникальных страниц</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Топ страниц */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              📊 Топ страниц — последние 7 дней
            </h2>
            {topPages.length === 0 ? (
              <div className="text-sm text-gray-400 py-4 text-center">
                Данных пока нет. Посетите страницы сайта, чтобы они появились здесь.
              </div>
            ) : (
              <div className="space-y-2">
                {topPages.map((page, i) => {
                  const pct = Math.round((page.count / topPages[0].count) * 100);
                  return (
                    <div key={page.path} className="flex items-center gap-3">
                      <div className="text-xs text-gray-400 w-4">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm text-gray-700 truncate">
                            {formatPath(page.path)}
                          </span>
                          <span className="text-sm font-medium text-[#002C5F] ml-2 shrink-0">
                            {page.count}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#002C5F] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Источники трафика */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              🌐 Источники трафика — 30 дней
            </h2>
            {sources.length === 0 ? (
              <div className="text-sm text-gray-400 py-4 text-center">
                Данных пока нет.
              </div>
            ) : (
              <div className="space-y-2">
                {sources.map((src) => {
                  const pct =
                    totalSourceCount > 0
                      ? Math.round((src.count / totalSourceCount) * 100)
                      : 0;
                  return (
                    <div key={src.referrer} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm text-gray-700">
                            {formatSource(src.referrer)}
                          </span>
                          <div className="flex items-center gap-2 ml-2 shrink-0">
                            <span className="text-xs text-gray-400">{pct}%</span>
                            <span className="text-sm font-medium text-[#002C5F]">
                              {src.count}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#BB162B] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* График по дням */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            📈 Динамика по дням — последние 14 дней
          </h2>
          {dailyStats.every((d) => d.count === 0) ? (
            <div className="text-sm text-gray-400 py-4 text-center">
              Данных пока нет.
            </div>
          ) : (
            <div className="flex items-end gap-1.5 h-32">
              {dailyStats.map((day) => {
                const height = Math.round((day.count / maxDayCount) * 100);
                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div className="relative w-full flex items-end justify-center h-24">
                      <div
                        className="w-full bg-[#002C5F] rounded-t opacity-80 hover:opacity-100 transition-opacity group relative"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${day.count} визитов`}
                      >
                        {day.count > 0 && (
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            {day.count}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-400 text-center leading-tight">
                      {formatDate(day.date)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Подвал */}
        <div className="text-center text-xs text-gray-400 pb-4">
          Данные обновляются в реальном времени · KMotors Admin
        </div>
      </main>
    </div>
  );
}
