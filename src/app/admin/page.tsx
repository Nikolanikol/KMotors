import AnalyticsChart from "@/components/analytics/AnalyticsChart";
import HoursChart from "@/components/analytics/HoursChart";
import LeadsTable from "@/components/admin/LeadsTable";
import AdminTabs from "@/components/admin/AdminTabs";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getYandexSummary,
  getYandexGeo,
  getYandexDaily,
  getYandexSources,
  getYandexDevices,
  getYandexHours,
} from "@/lib/analytics/yandex";
import {
  getGA4Summary,
  getGA4Geo,
  getGA4Daily,
  getGA4Sources,
  getGA4Devices,
  getGA4TopPages,
} from "@/lib/analytics/ga4";
import {
  getTopQueries,
  getTopPages as getGSCTopPages,
  getTopCountries as getGSCTopCountries,
} from "@/lib/analytics/searchconsole";

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

// ISO 3166-1 alpha-3 → читаемое название (используется в GSC)
const GSC_COUNTRY_NAMES: Record<string, string> = {
  rus: "🇷🇺 Россия",
  kaz: "🇰🇿 Казахстан",
  uzb: "🇺🇿 Узбекистан",
  geo: "🇬🇪 Грузия",
  sau: "🇸🇦 Саудовская Аравия",
  are: "🇦🇪 ОАЭ",
  kor: "🇰🇷 Корея",
  deu: "🇩🇪 Германия",
  usa: "🇺🇸 США",
  ukr: "🇺🇦 Украина",
  blr: "🇧🇾 Беларусь",
  arm: "🇦🇲 Армения",
  aze: "🇦🇿 Азербайджан",
  tur: "🇹🇷 Турция",
  isr: "🇮🇱 Израиль",
  fra: "🇫🇷 Франция",
  gbr: "🇬🇧 Великобритания",
  pol: "🇵🇱 Польша",
  cze: "🇨🇿 Чехия",
  svk: "🇸🇰 Словакия",
  can: "🇨🇦 Канада",
  aus: "🇦🇺 Австралия",
  bel: "🇧🇪 Бельгия",
  nld: "🇳🇱 Нидерланды",
  ita: "🇮🇹 Италия",
  esp: "🇪🇸 Испания",
  prt: "🇵🇹 Португалия",
  swe: "🇸🇪 Швеция",
  nor: "🇳🇴 Норвегия",
  fin: "🇫🇮 Финляндия",
  mda: "🇲🇩 Молдова",
  kgz: "🇰🇬 Кыргызстан",
  tjk: "🇹🇯 Таджикистан",
  tkm: "🇹🇲 Туркменистан",
  mnl: "🇲🇳 Монголия",
  chn: "🇨🇳 Китай",
  jpn: "🇯🇵 Япония",
  khm: "🇰🇭 Камбоджа",
  mhl: "🇲🇭 Маршалловы острова",
  ago: "🇦🇴 Ангола",
  yem: "🇾🇪 Йемен",
  alb: "🇦🇱 Албания",
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

const TZ = "Asia/Seoul";

function fmtDate(str: string): string {
  return new Date(str).toLocaleString("ru-RU", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    timeZone: TZ,
  });
}

function fmtShortDate(str: string): string {
  return new Date(str).toLocaleDateString("ru-RU", {
    day: "numeric", month: "short",
    timeZone: TZ,
  });
}

// ─── Страница ────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session");
  if (!sessionCookie || sessionCookie.value !== "1") {
    redirect("/admin/login");
  }


  const supabase = createServerClient();
  const now = new Date();
  const days7ago   = new Date(now.getTime() -  7 * 86400000).toISOString();
  const days14ago  = new Date(now.getTime() - 14 * 86400000).toISOString();
  const days30ago  = new Date(now.getTime() - 30 * 86400000).toISOString();
  // Предыдущие периоды для сравнения (WoW / MoM)
  const days7to14ago  = new Date(now.getTime() - 14 * 86400000).toISOString();
  const days14to21ago = new Date(now.getTime() - 21 * 86400000).toISOString();  // не используется
  const days30to60ago = new Date(now.getTime() - 60 * 86400000).toISOString();

  // ── Все запросы параллельно ──────────────────────────────────────────────
  // ── Яндекс + GA4 — параллельно ──────────────────────────────────────────
  const [
    yaSummary, yaGeo, yaDaily, yaSources, yaDevices, yaHours,
    ga4Summary, ga4Geo, ga4Daily, ga4Sources, ga4Devices, ga4Pages,
    gscQueries, gscPages, gscCountries,
  ] = await Promise.all([
    getYandexSummary(30),
    getYandexGeo(30),
    getYandexDaily(14),
    getYandexSources(30),
    getYandexDevices(30),
    getYandexHours(7),
    getGA4Summary(30),
    getGA4Geo(30),
    getGA4Daily(14),
    getGA4Sources(30),
    getGA4Devices(30),
    getGA4TopPages(7),
    getTopQueries(28),
    getGSCTopPages(28),
    getGSCTopCountries(28),
  ]);

  const [
    { count: total7 },
    { count: total30 },
    { count: prevTotal7 },
    { count: prevTotal30 },
    { data: topPages },
    { data: sources },
    { data: dailyData },
    { data: countries },
    { data: devices },
    { data: hourlyRaw },
    { count: leadsTotal7 },
    { count: leadsTotal30 },
    { count: prevLeadsTotal7 },
    { data: recentLeads },
    { data: topCars },
  ] = await Promise.all([
    // Визиты — текущий период
    supabase.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", days7ago),
    supabase.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", days30ago),
    // Визиты — предыдущий период (для WoW/MoM сравнения)
    supabase.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", days7to14ago).lt("created_at", days7ago),
    supabase.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", days30to60ago).lt("created_at", days30ago),
    // Топ страниц через RPC
    supabase.rpc("get_top_pages", { since_date: days7ago, limit_count: 10 }),
    // Источники через RPC
    supabase.rpc("get_traffic_sources", { since_date: days30ago }),
    // График по дням через RPC
    supabase.rpc("get_daily_views", { since_date: days14ago }),
    // Страны
    supabase.from("page_views").select("country").gte("created_at", days30ago).not("country", "is", null).limit(5000),
    // Устройства
    supabase.from("page_views").select("device").gte("created_at", days30ago).not("device", "is", null).limit(5000),
    // Часы активности
    supabase.from("page_views").select("created_at").gte("created_at", days7ago).limit(5000),
    // Лиды — текущий период
    supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", days7ago),
    supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", days30ago),
    // Лиды — предыдущая неделя
    supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", days7to14ago).lt("created_at", days7ago),
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

  // График по дням — RPC возвращает уже агрегированные {day, views}, заполняем пропуски нулями
  const toSeoulDate = (d: Date) =>
    d.toLocaleDateString("sv-SE", { timeZone: TZ }); // "YYYY-MM-DD"
  const dayMap: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    dayMap[toSeoulDate(d)] = 0;
  }
  (dailyData || []).forEach((r: { day: string; views: number }) => {
    const key = r.day.slice(0, 10); // "YYYY-MM-DD"
    if (key in dayMap) dayMap[key] = Number(r.views);
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

  // Дельта для сравнения периодов: возвращает строку "+12%" / "-5%" / "—"
  function delta(current: number | null, previous: number | null): { text: string; up: boolean | null } {
    if (!current || !previous || previous === 0) return { text: "—", up: null };
    const pct = Math.round(((current - previous) / previous) * 100);
    return { text: `${pct > 0 ? "+" : ""}${pct}%`, up: pct >= 0 };
  }
  const d7  = delta(total7,       prevTotal7);
  const d30 = delta(total30,      prevTotal30);
  const dL7 = delta(leadsTotal7,  prevLeadsTotal7);

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

      <AdminTabs
        overview={<>

        {/* ── Главные метрики ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Визитов за 7 дней",  value: (total7  || 0).toLocaleString("ru"), color: "text-[#002C5F]", d: d7,  hint: "vs прошлая неделя" },
            { label: "Визитов за 30 дней", value: (total30 || 0).toLocaleString("ru"), color: "text-[#002C5F]", d: d30, hint: "vs прошлый месяц" },
            { label: "Заявок за 7 дней",   value: (leadsTotal7 || 0).toString(),        color: "text-orange-500", d: dL7, hint: "vs прошлая неделя" },
            { label: "Конверсия (30 дн.)", value: `${convRate}%`,                        color: "text-green-600", d: { text: "—", up: null }, hint: "" },
          ].map((m) => (
            <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">{m.label}</span>
                {m.d.text !== "—" && (
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${m.d.up ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {m.d.up ? "↑" : "↓"} {m.d.text}
                  </span>
                )}
              </div>
              {m.hint && <div className="text-xs text-gray-400 mt-0.5">{m.hint}</div>}
            </div>
          ))}
        </div>

        {/* ── График по дням ── */}
        <AnalyticsChart
          data={dayStats.map(([date, count]) => ({ date, orders: count }))}
          type="orders"
          title="Визиты на сайт — последние 14 дней (собственный трекер)"
        />

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
                <div className="text-sm text-gray-400 text-center py-4">Нет данных — трафик ещё не накоплен</div>
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
              <div className="text-sm text-gray-400 text-center py-4">Нет данных — трафик ещё не накоплен</div>
            )}
          </div>

        </div>

        </>}
        yandex={<>

        {/* ── ЯНДЕКС.МЕТРИКА ── */}
        <div className="border-t-2 border-orange-100 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">Я</span>
            </div>
            <h2 className="text-lg font-bold text-gray-800">Яндекс.Метрика — чистые данные</h2>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">без ботов</span>
          </div>

          {!yaSummary ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
              ⚠️ Добавьте YANDEX_METRIKA_TOKEN в переменные окружения Vercel
            </div>
          ) : (
            <div className="space-y-4">

              {/* Метрики Яндекса */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "Визиты (30 дн.)",    value: yaSummary.visits.toLocaleString("ru"),   color: "text-red-500" },
                  { label: "Пользователи",        value: yaSummary.users.toLocaleString("ru"),    color: "text-red-500" },
                  { label: "Bounce Rate",         value: `${yaSummary.bounceRate}%`,              color: "text-orange-500" },
                  { label: "Ср. время (сек)",     value: `${yaSummary.avgDuration}с`,             color: "text-blue-500" },
                  { label: "Глубина просмотра",   value: `${yaSummary.pageDepth} стр.`,          color: "text-green-600" },
                ].map((m) => (
                  <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* График по дням Яндекс */}
              {yaDaily.length > 0 && (
                <AnalyticsChart
                  data={yaDaily}
                  type="yandex"
                  title="Динамика визитов — 14 дней (Яндекс)"
                />
              )}

              {/* Гео + Источники */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* География Яндекс */}
                {yaGeo.length > 0 && (() => {
                  const maxGeo = Math.max(...yaGeo.map(g => g.visits), 1);
                  const totalGeoVisits = yaGeo.reduce((a, g) => a + g.visits, 0) || 1;
                  return (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="text-sm font-semibold text-gray-700 mb-3">🌍 География (Яндекс, без ботов)</div>
                      <div className="space-y-2">
                        {yaGeo.map((g) => (
                          <div key={g.country} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700 truncate max-w-[60%]">{g.country}</span>
                              <span className="text-gray-500 flex-shrink-0">
                                {Math.round((g.visits / totalGeoVisits) * 100)}% · {g.visits}
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${(g.visits / maxGeo) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Источники Яндекс */}
                {yaSources.length > 0 && (() => {
                  const maxSrc = Math.max(...yaSources.map(s => s.visits), 1);
                  const totalSrc = yaSources.reduce((a, s) => a + s.visits, 0) || 1;
                  const srcColors: Record<string, string> = {
                    "Переходы из поисковых систем": "#4285F4",
                    "Прямые заходы": "#6B7280",
                    "Переходы из социальных сетей": "#E1306C",
                    "Переходы по рекламе": "#FF9800",
                    "Переходы с других сайтов": "#9C27B0",
                  };
                  return (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="text-sm font-semibold text-gray-700 mb-3">🔗 Источники трафика (Яндекс)</div>
                      <div className="space-y-2">
                        {yaSources.map((s) => {
                          const pct = Math.round((s.visits / totalSrc) * 100);
                          const color = srcColors[s.source] || "#6B7280";
                          return (
                            <div key={s.source} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-700 truncate max-w-[65%]">{s.source}</span>
                                <span className="text-gray-500 flex-shrink-0">{pct}% · {s.visits}</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full" style={{ width: `${(s.visits / maxSrc) * 100}%`, backgroundColor: color }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Устройства + Часы */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Устройства Яндекс */}
                {yaDevices.length > 0 && (() => {
                  const totalDev = yaDevices.reduce((a, d) => a + d.visits, 0) || 1;
                  const devColors: Record<string, string> = { desktop: "bg-[#002C5F]", mobile: "bg-orange-400", tablet: "bg-blue-300" };
                  const devLabels: Record<string, string> = { desktop: "💻 Десктоп", mobile: "📱 Мобильный", tablet: "📟 Планшет" };
                  return (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="text-sm font-semibold text-gray-700 mb-3">📱 Устройства (Яндекс)</div>
                      <div className="space-y-3">
                        {yaDevices.map((d) => {
                          const dl = d.device.toLowerCase();
                          const key = (dl.includes("mobile") || dl.includes("smartphone") || dl === "смартфоны") ? "mobile"
                            : (dl.includes("tablet") || dl === "планшеты") ? "tablet" : "desktop";
                          const pct = Math.round((d.visits / totalDev) * 100);
                          return (
                            <div key={d.device} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-700">{devLabels[key] || d.device}</span>
                                <span className="text-gray-500">{pct}% · {d.visits}</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className={`${devColors[key] || "bg-gray-400"} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Часы активности Яндекс */}
                {yaHours.length > 0 && (
                  <HoursChart
                    data={yaHours}
                    color="#e63e25"
                    title="🕐 Часы активности (Яндекс, 7 дней)"
                  />
                )}
              </div>

            </div>
          )}
        </div>

        </>}
        ga4={<>

        {/* ── GOOGLE ANALYTICS 4 ── */}
        <div className="border-t-2 border-blue-100 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#E37400] flex items-center justify-center">
              <span className="text-white text-xs font-bold">G</span>
            </div>
            <h2 className="text-lg font-bold text-gray-800">Google Analytics 4</h2>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">без ботов</span>
          </div>

          {!ga4Summary ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 space-y-1">
              <p className="font-semibold">⚠️ GA4 не подключён</p>
              <p>Добавьте в Vercel Environment Variables:</p>
              <p className="font-mono text-xs">GA4_CREDENTIALS = {'<'}содержимое JSON файла{'>'}</p>
              <p className="font-mono text-xs">GA4_PROPERTY_ID = 504496694</p>
              <p className="mt-2">И добавьте сервисный аккаунт в GA4 → Управление доступом к ресурсу → Читатель</p>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Метрики GA4 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Пользователи (30 дн.)", value: ga4Summary.users.toLocaleString("ru"),    color: "text-[#E37400]" },
                  { label: "Сессии",                value: ga4Summary.sessions.toLocaleString("ru"), color: "text-[#E37400]" },
                  { label: "Bounce Rate",           value: `${ga4Summary.bounceRate}%`,              color: "text-orange-500" },
                  { label: "Ср. время (сек)",       value: `${ga4Summary.avgDuration}с`,             color: "text-blue-500"   },
                ].map((m) => (
                  <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* График GA4 */}
              {ga4Daily.length > 0 && (
                <AnalyticsChart
                  data={ga4Daily}
                  type="ga4"
                  title="Динамика сессий — 14 дней (GA4)"
                />
              )}

              {/* Гео + Источники GA4 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {ga4Geo.length > 0 && (() => {
                  const maxGeo = Math.max(...ga4Geo.map(g => g.sessions), 1);
                  const total = ga4Geo.reduce((a, g) => a + g.sessions, 0) || 1;
                  return (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="text-sm font-semibold text-gray-700 mb-3">🌍 География (GA4)</div>
                      <div className="space-y-2">
                        {ga4Geo.map((g) => (
                          <div key={g.country} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700 truncate max-w-[60%]">{g.country}</span>
                              <span className="text-gray-500 flex-shrink-0">{Math.round((g.sessions / total) * 100)}% · {g.sessions}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div className="bg-[#E37400] h-1.5 rounded-full" style={{ width: `${(g.sessions / maxGeo) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {ga4Sources.length > 0 && (() => {
                  const maxSrc = Math.max(...ga4Sources.map(s => s.sessions), 1);
                  const total = ga4Sources.reduce((a, s) => a + s.sessions, 0) || 1;
                  const srcColors: Record<string, string> = {
                    "Organic Search": "#4285F4", "Direct": "#6B7280",
                    "Organic Social": "#E1306C", "Paid Search": "#FF9800",
                    "Referral": "#9C27B0", "Email": "#00BCD4",
                  };
                  return (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="text-sm font-semibold text-gray-700 mb-3">🔗 Каналы трафика (GA4)</div>
                      <div className="space-y-2">
                        {ga4Sources.map((s) => {
                          const pct = Math.round((s.sessions / total) * 100);
                          return (
                            <div key={s.source} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-700 truncate max-w-[65%]">{s.source}</span>
                                <span className="text-gray-500 flex-shrink-0">{pct}% · {s.sessions}</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full" style={{ width: `${(s.sessions / maxSrc) * 100}%`, backgroundColor: srcColors[s.source] || "#6B7280" }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Устройства + Топ страниц GA4 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {ga4Devices.length > 0 && (() => {
                  const total = ga4Devices.reduce((a, d) => a + d.sessions, 0) || 1;
                  const devIcons: Record<string, string> = { desktop: "💻", mobile: "📱", tablet: "📟" };
                  return (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="text-sm font-semibold text-gray-700 mb-3">📱 Устройства (GA4)</div>
                      <div className="space-y-3">
                        {ga4Devices.map((d) => {
                          const pct = Math.round((d.sessions / total) * 100);
                          const icon = devIcons[d.device.toLowerCase()] || "🖥️";
                          return (
                            <div key={d.device} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-700">{icon} {d.device}</span>
                                <span className="text-gray-500">{pct}% · {d.sessions}</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-[#E37400] h-2 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {ga4Pages.length > 0 && (() => {
                  const maxV = Math.max(...ga4Pages.map(p => p.views), 1);
                  return (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="text-sm font-semibold text-gray-700 mb-3">🔥 Топ страниц — 7 дней (GA4)</div>
                      <div className="space-y-2">
                        {ga4Pages.map((p) => (
                          <div key={p.page} className="space-y-1">
                            <div className="flex justify-between text-sm gap-2">
                              <span className="text-gray-700 truncate max-w-[70%] font-mono text-xs">{p.page}</span>
                              <span className="font-semibold text-gray-900 flex-shrink-0">{p.views}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div className="bg-[#002C5F] h-1.5 rounded-full" style={{ width: `${(p.views / maxV) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>
          )}
        </div>

        </>}
        leads={<>

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

          {/* Таблица заявок с поиском, фильтром и экспортом */}
          <LeadsTable leads={recentLeads || []} />

        </div>

        </>}
        search={<>

      {/* ── Google Search Console ── */}
      <div className="pb-10">
        <div className="flex items-center gap-2 mb-4 mt-6">
          <span className="text-lg">🔍</span>
          <span className="font-bold text-gray-800">Google Search Console</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">28 дней</span>
        </div>

        {gscQueries.length > 0 ? (
          <div className="space-y-4">

            {/* Топ запросов */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm font-semibold text-gray-700 mb-3">🔑 Топ ключевых слов</div>
              <div className="space-y-2">
                {gscQueries.slice(0, 15).map((q) => (
                  <div key={q.query} className="flex items-center gap-3 text-sm">
                    <div className="flex-1 truncate text-gray-700">{q.query}</div>
                    <div className="text-blue-600 font-medium w-14 text-right">{q.clicks} кл.</div>
                    <div className="text-gray-400 w-16 text-right">{q.impressions.toLocaleString()} пок.</div>
                    <div className="text-green-600 w-10 text-right">{q.ctr}%</div>
                    <div className="text-orange-500 w-12 text-right">#{q.position}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Топ страниц + страны */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {gscPages.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-sm font-semibold text-gray-700 mb-3">📄 Топ страниц (поиск)</div>
                  <div className="space-y-2">
                    {gscPages.map((p) => (
                      <div key={p.page} className="flex justify-between text-sm">
                        <span className="text-gray-600 truncate max-w-[70%]">{p.page || "/"}</span>
                        <span className="text-blue-600 font-medium">{p.clicks} кл.</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {gscCountries.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-sm font-semibold text-gray-700 mb-3">🌍 География (поиск)</div>
                  <div className="space-y-2">
                    {gscCountries.map((c) => (
                      <div key={c.country} className="flex justify-between text-sm">
                        <span className="text-gray-600">{GSC_COUNTRY_NAMES[c.country.toLowerCase()] || c.country.toUpperCase()}</span>
                        <span className="text-blue-600 font-medium">{c.clicks} кл. · {c.impressions} пок.</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-sm text-yellow-800 space-y-1">
            <p className="font-semibold">⚠️ Search Console: нет данных</p>
            <p>Возможные причины: сайт недавно добавлен, GA4_REFRESH_TOKEN не настроен, или нет кликов за 28 дней.</p>
          </div>
        )}
      </div>

        </>}
      />
    </div>
  );
}
