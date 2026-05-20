import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// ─── Хелперы ────────────────────────────────────────────────────────────────

function formatPath(path: string): string {
  const clean = path.replace(/^\/(ru|en|ko|ka|ar)/, "");
  if (!clean || clean === "/") return "Главная";
  if (clean.startsWith("/catalog/")) return `Авто #${clean.replace("/catalog/", "")}`;
  if (clean.startsWith("/blog/")) return `Блог: ${clean.replace("/blog/", "")}`;
  if (clean === "/catalog") return "Каталог";
  if (clean === "/blog") return "Блог";
  if (clean === "/contact") return "Контакты";
  if (clean === "/buy") return "Как купить";
  if (clean === "/parts") return "Запчасти";
  return clean;
}

const SOURCE_LABELS: Record<string, string> = {
  direct: "Прямые переходы",
  google: "Google",
  yandex: "Яндекс",
  telegram: "Telegram",
  instagram: "Instagram",
  vk: "ВКонтакте",
  facebook: "Facebook",
  youtube: "YouTube",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  dzen: "Дзен",
  "avito": "Avito",
  "auto.ru": "Auto.ru",
};

const SOURCE_COLORS: Record<string, string> = {
  google: "#4285F4",
  yandex: "#FF0000",
  telegram: "#2AABEE",
  instagram: "#E1306C",
  vk: "#4C75A3",
  facebook: "#1877F2",
  youtube: "#FF0000",
  tiktok: "#000000",
  direct: "#6B7280",
};

const COUNTRY_NAMES: Record<string, string> = {
  RU: "🇷🇺 Россия",
  KZ: "🇰🇿 Казахстан",
  UZ: "🇺🇿 Узбекистан",
  GE: "🇬🇪 Грузия",
  SA: "🇸🇦 Саудовская Аравия",
  AE: "🇦🇪 ОАЭ",
  KR: "🇰🇷 Корея",
  DE: "🇩🇪 Германия",
  US: "🇺🇸 США",
  UA: "🇺🇦 Украина",
  BY: "🇧🇾 Беларусь",
  AM: "🇦🇲 Армения",
  AZ: "🇦🇿 Азербайджан",
};

const LEAD_SOURCE_LABELS: Record<string, string> = {
  car_detail: "Карточка машины",
  car_detail_mobile: "Карточка (моб.)",
  car_calculator: "Калькулятор",
  header: "Шапка сайта",
  contact: "Контакты",
  parts: "Запчасти",
  blog: "Блог",
  unknown: "Неизвестно",
};

function fmtDate(str: string): string {
  return new Date(str).toLocaleString("ru-RU", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function fmtShortDate(str: string): string {
  const d = new Date(str);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

// ─── Страница ────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session");
  if (!sessionCookie || sessionCookie.value !== process.env.ADMIN_PASSWORD) {
    redirect("/admin/login");
  }

  const supabase = createServerClient();
  const now = new Date();
  const days7ago  = new Date(now.getTime() -  7 * 86400000).toISOString();
  const days30ago = new Date(now.getTime() - 30 * 86400000).toISOString();
  const days14ago = new Date(now.getTime() - 14 * 86400000).toISOString();

  // ── Все запросы параллельно ──────────────────────────────────────────────
  const [
    { count: total7 },
    { count: total30 },
    { data: topPages },
    { data: sources },
    { data: dailyData },
    { data: countries },
    { data: devices },
    { data: hourlyRaw },
    { count: leadsTotal7 },
    { count: leadsTotal30 },
    { data: recentLeads },
    { data: topCars },
  ] = await Promise.all([
    // Визиты 7 дней
    supabase.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", days7ago),
    // Визиты 30 дней
    supabase.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", days30ago),
    // Топ страниц через RPC
    supabase.rpc("get_top_pages", { since_date: days7ago, limit_count: 10 }),
    // Источники через RPC
    supabase.rpc("get_traffic_sources", { since_date: days30ago }),
    // График по дням через RPC
    supabase.rpc("get_daily_stats", { since_date: days14ago }),
    // Страны
    supabase.from("page_views").select("country").gte("created_at", days30ago).not("country", "is", null).limit(5000),
    // Устройства
    supabase.from("page_views").select("device").gte("created_at", days30ago).not("device", "is", null).limit(5000),
    // Часы активности
    supabase.from("page_views").select("created_at").gte("created_at", days7ago).limit(5000),
    // Лиды 7 дней
    supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", days7ago),
    // Лиды 30 дней
    supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", days30ago),
    // Последние заявки
    supabase.from("leads").select("id,name,phone,car_name,source_page,created_at,messenger,vin,tg_username").order("created_at", { ascending: false }).limit(20),
    // Топ просматриваемых машин
    supabase.rpc("get_top_cars", { since_date: days30ago, limit_count: 10 }),
  ]);

  // ── Агрегации ────────────────────────────────────────────────────────────

  // Страны
  const countryMap: Record<string, number> = {};
  (countries || []).forEach((r) => {
    if (r.country) countryMap[r.country] = (countryMap[r.country] || 0) + 1;
  });
  const countryStats = Object.entries(countryMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCountry = Math.max(...countryStats.map((c) => c[1]), 1);

  // Устройства
  const deviceMap: Record<string, number> = {};
  (devices || []).forEach((r) => {
    if (r.device) deviceMap[r.device] = (deviceMap[r.device] || 0) + 1;
  });
  const totalDevices = Object.values(deviceMap).reduce((a, b) => a + b, 0) || 1;

  // Часы активности
  const hourMap: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourMap[h] = 0;
  (hourlyRaw || []).forEach((r) => {
    const h = new Date(r.created_at).getHours();
    hourMap[h] = (hourMap[h] || 0) + 1;
  });
  const maxHour = Math.max(...Object.values(hourMap), 1);

  // График по дням — заполняем пропуски нулями
  const dayMap: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    dayMap[d.toISOString().slice(0, 10)] = 0;
  }
  (dailyData || []).forEach((r: { date: string; count: number }) => {
    if (r.date in dayMap) dayMap[r.date] = Number(r.count);
  });
  const dayStats = Object.entries(dayMap);
  const maxDay = Math.max(...dayStats.map((d) => d[1]), 1);

  // Топ страниц — с именами машин из JOIN
  const topPagesList = (topPages || []).map((r: { path: string; car_name: string | null; count: number }) => ({
    path: r.path,
    label: r.car_name || formatPath(r.path),
    url: r.car_name ? `/ru/catalog/${r.path.match(/\/catalog\/(\d+)/)?.[1]}` : null,
    count: Number(r.count),
  }));
  const maxPage = Math.max(...topPagesList.map((p: { count: number }) => p.count), 1);

  // Источники
  const sourceList = (sources || []) as { referrer: string; count: number }[];
  const totalSources = sourceList.reduce((a, b) => a + Number(b.count), 0) || 1;

  // Конверсия
  const convRate = total30 && (leadsTotal30 || 0) > 0
    ? (((leadsTotal30 || 0) / total30) * 100).toFixed(2)
    : "0.00";

  // Лиды по источнику
  const leadsSourceMap: Record<string, number> = {};
  (recentLeads || []).forEach((l) => {
    const s = l.source_page || "unknown";
    leadsSourceMap[s] = (leadsSourceMap[s] || 0) + 1;
  });

  // ── JSX ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="bg-[#002C5F] text-white px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-lg font-bold">KMotors Admin</div>
          <div className="text-xs text-blue-200">Панель аналитики</div>
        </div>
        <a href="/" className="text-xs text-blue-200 hover:text-white transition-colors">← На сайт</a>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ── Главные метрики ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Визитов за 7 дней",   value: (total7  || 0).toLocaleString("ru"), color: "text-[#002C5F]" },
            { label: "Визитов за 30 дней",  value: (total30 || 0).toLocaleString("ru"), color: "text-[#002C5F]" },
            { label: "Заявок за 7 дней",    value: (leadsTotal7  || 0).toString(),       color: "text-orange-500" },
            { label: "Конверсия (30 дн.)",  value: `${convRate}%`,                       color: "text-green-600" },
          ].map((m) => (
            <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
              <div className="text-sm text-gray-500 mt-1">{m.label}</div>
            </div>
          ))}
        </div>

        {/* ── График по дням ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-semibold text-gray-700 mb-4">Динамика визитов — последние 14 дней</div>
          <div className="flex items-end gap-1 h-32">
            {dayStats.map(([date, count]) => (
              <div key={date} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full bg-[#002C5F] rounded-t hover:bg-orange-500 transition-colors"
                  style={{ height: `${Math.max((count / maxDay) * 100, count > 0 ? 4 : 1)}%` }}
                />
                {/* Тултип */}
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                  {count} визитов
                </div>
              </div>
            ))}
          </div>
          {/* Даты */}
          <div className="flex gap-1 mt-2">
            {dayStats.map(([date], i) => (
              <div key={date} className="flex-1 text-center">
                {(i === 0 || i === 6 || i === 13) && (
                  <span className="text-xs text-gray-400">{fmtShortDate(date)}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Строка: топ страниц + источники ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Топ страниц */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm font-semibold text-gray-700 mb-3">Топ страниц — 7 дней</div>
            <div className="space-y-2">
              {topPagesList.map((p: { path: string; label: string; url: string | null; count: number }) => (
                <div key={p.path} className="space-y-1">
                  <div className="flex justify-between text-sm gap-2">
                    {p.url ? (
                      <a
                        href={p.url}
                        target="_blank"
                        className="text-orange-500 hover:underline truncate max-w-[70%]"
                      >
                        {p.label}
                      </a>
                    ) : (
                      <span className="text-gray-700 truncate max-w-[70%]">{p.label}</span>
                    )}
                    <span className="font-semibold text-gray-900 flex-shrink-0">{p.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-[#002C5F] h-1.5 rounded-full"
                      style={{ width: `${(p.count / maxPage) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {topPagesList.length === 0 && (
                <div className="text-sm text-gray-400 text-center py-4">Данных пока нет</div>
              )}
            </div>
          </div>

          {/* Источники */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm font-semibold text-gray-700 mb-3">Источники трафика — 30 дней</div>
            <div className="space-y-2">
              {sourceList.slice(0, 8).map((s) => {
                const pct = Math.round((Number(s.count) / totalSources) * 100);
                const color = SOURCE_COLORS[s.referrer] || "#6B7280";
                return (
                  <div key={s.referrer} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">{SOURCE_LABELS[s.referrer] || s.referrer}</span>
                      <span className="text-gray-500 flex-shrink-0">{pct}% · {Number(s.count).toLocaleString("ru")}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
              {sourceList.length === 0 && (
                <div className="text-sm text-gray-400 text-center py-4">Данных пока нет</div>
              )}
            </div>
          </div>
        </div>

        {/* ── Строка: страны + устройства + часы ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Страны */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm font-semibold text-gray-700 mb-3">География — 30 дней</div>
            <div className="space-y-2">
              {countryStats.map(([code, count]) => (
                <div key={code} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">{COUNTRY_NAMES[code] || `🌐 ${code}`}</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-orange-400 h-1.5 rounded-full"
                      style={{ width: `${(count / maxCountry) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {countryStats.length === 0 && (
                <div className="text-sm text-gray-400 text-center py-4">Появится после деплоя</div>
              )}
            </div>
          </div>

          {/* Устройства */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm font-semibold text-gray-700 mb-3">Устройства — 30 дней</div>
            {totalDevices > 1 ? (
              <div className="space-y-3">
                {[
                  { key: "mobile",  label: "Мобильный", color: "bg-orange-400" },
                  { key: "desktop", label: "Десктоп",   color: "bg-[#002C5F]" },
                  { key: "tablet",  label: "Планшет",   color: "bg-blue-300"  },
                ].map(({ key, label, color }) => {
                  const cnt = deviceMap[key] || 0;
                  const pct = Math.round((cnt / totalDevices) * 100);
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">{label}</span>
                        <span className="text-gray-500">{pct}% · {cnt}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-gray-400 text-center py-4">Появится после деплоя</div>
            )}
          </div>

          {/* Часы активности */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm font-semibold text-gray-700 mb-3">Часы активности — 7 дней</div>
            <div className="flex items-end gap-px h-20">
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="flex-1 flex flex-col items-center group relative">
                  <div
                    className="w-full bg-[#002C5F] rounded-t hover:bg-orange-500 transition-colors"
                    style={{ height: `${Math.max((hourMap[h] / maxHour) * 100, hourMap[h] > 0 ? 4 : 1)}%` }}
                  />
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                    {h}:00 — {hourMap[h]}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0:00</span><span>6:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
            </div>
          </div>
        </div>

        {/* ── Топ машин ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-semibold text-gray-700 mb-3">
            Топ просматриваемых машин — 30 дней
          </div>
          {!topCars || topCars.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-4">
              Данные появятся после первых просмотров
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {(topCars as { car_name: string; car_id: string; count: number }[]).map((car, i) => (
                <div key={car.car_id} className="flex items-center gap-3 py-2.5">
                  <span className="text-lg font-bold text-gray-200 w-6 text-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <a
                      href={`/ru/catalog/${car.car_id}`}
                      target="_blank"
                      className="text-sm font-medium text-gray-900 hover:text-orange-500 transition-colors truncate block"
                    >
                      {car.car_name}
                    </a>
                    <span className="text-xs text-gray-400">#{car.car_id}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#002C5F] flex-shrink-0">
                    {Number(car.count).toLocaleString("ru")} просм.
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Заявки ── */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Заявки</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-2xl font-bold text-orange-500">{(leadsTotal7 || 0)}</div>
              <div className="text-sm text-gray-500 mt-1">За 7 дней</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-2xl font-bold text-orange-500">{(leadsTotal30 || 0)}</div>
              <div className="text-sm text-gray-500 mt-1">За 30 дней</div>
            </div>
            {Object.entries(leadsSourceMap).sort((a,b) => b[1]-a[1]).slice(0,2).map(([src, cnt]) => (
              <div key={src} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-2xl font-bold text-orange-500">{cnt}</div>
                <div className="text-sm text-gray-500 mt-1">{LEAD_SOURCE_LABELS[src] || src}</div>
              </div>
            ))}
          </div>

          {/* Таблица заявок */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-700">Последние заявки</div>
              <div className="text-xs text-gray-400">последние 20</div>
            </div>
            {!recentLeads || recentLeads.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">Заявок пока нет</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">{lead.name}</div>
                      <a href={`tel:${lead.phone}`} className="text-orange-500 text-sm hover:underline">
                        {lead.phone}
                      </a>
                      {lead.car_name && (
                        <div className="text-xs text-gray-400 truncate">{lead.car_name}</div>
                      )}
                      {lead.vin && (
                        <div className="text-xs text-gray-500 font-mono">VIN: {lead.vin}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {lead.messenger === "whatsapp" && (
                        <a
                          href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          💚 WhatsApp
                        </a>
                      )}
                      {lead.messenger === "telegram" && (
                        lead.tg_username ? (
                          <a
                            href={`https://t.me/${lead.tg_username.replace(/^@/, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            ✈️ {lead.tg_username}
                          </a>
                        ) : (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
                            ✈️ Telegram
                          </span>
                        )
                      )}
                      <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-lg">
                        {LEAD_SOURCE_LABELS[lead.source_page] || lead.source_page}
                      </span>
                      <span className="text-xs text-gray-400">{fmtDate(lead.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 pb-4">
          KMotors Admin · данные обновляются в реальном времени
        </div>
      </main>
    </div>
  );
}
