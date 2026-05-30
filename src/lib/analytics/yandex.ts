const COUNTER_ID = "109267986";
const BASE_URL = "https://api-metrika.yandex.net/stat/v1/data";

async function yandexFetch(params: Record<string, string>) {
  const token = process.env.YANDEX_METRIKA_TOKEN;
  if (!token) return null;

  const url = new URL(BASE_URL);
  url.searchParams.set("ids", COUNTER_ID);
  url.searchParams.set("oauth_token", token);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export interface YandexSummary {
  visits: number;
  users: number;
  bounceRate: number;
  avgDuration: number;
  pageDepth: number;
}

export interface YandexGeoRow {
  country: string;
  visits: number;
  users: number;
}

export interface YandexDayRow {
  date: string;
  visits: number;
  users: number;
}

export interface YandexSourceRow {
  source: string;
  visits: number;
}

export interface YandexDeviceRow {
  device: string;
  visits: number;
}

export interface YandexHourRow {
  hour: number;
  visits: number;
}

export async function getYandexSummary(days = 30): Promise<YandexSummary | null> {
  const data = await yandexFetch({
    metrics: "ym:s:visits,ym:s:users,ym:s:bounceRate,ym:s:avgVisitDurationSeconds,ym:s:pageDepth",
    date1: `${days}daysAgo`,
    date2: "today",
  });
  if (!data?.totals) return null;
  return {
    visits: Math.round(data.totals[0]),
    users: Math.round(data.totals[1]),
    bounceRate: Math.round(data.totals[2]),
    avgDuration: Math.round(data.totals[3]),
    pageDepth: Math.round(data.totals[4] * 10) / 10,
  };
}

export async function getYandexGeo(days = 30): Promise<YandexGeoRow[]> {
  const data = await yandexFetch({
    dimensions: "ym:s:regionCountry",
    metrics: "ym:s:visits,ym:s:users",
    date1: `${days}daysAgo`,
    date2: "today",
    limit: "10",
    sort: "-ym:s:visits",
  });
  if (!data?.data) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.data.map((row: any) => ({
    country: row.dimensions[0]?.name || "Unknown",
    visits: Math.round(row.metrics[0]),
    users: Math.round(row.metrics[1]),
  }));
}

export async function getYandexDaily(days = 14): Promise<YandexDayRow[]> {
  const data = await yandexFetch({
    dimensions: "ym:s:date",
    metrics: "ym:s:visits,ym:s:users",
    date1: `${days}daysAgo`,
    date2: "today",
    sort: "ym:s:date",
    limit: "30",
  });
  if (!data?.data) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.data.map((row: any) => ({
    date: row.dimensions[0]?.name || "",
    visits: Math.round(row.metrics[0]),
    users: Math.round(row.metrics[1]),
  }));
}

export async function getYandexSources(days = 30): Promise<YandexSourceRow[]> {
  const data = await yandexFetch({
    dimensions: "ym:s:trafficSource",
    metrics: "ym:s:visits",
    date1: `${days}daysAgo`,
    date2: "today",
    sort: "-ym:s:visits",
    limit: "8",
  });
  if (!data?.data) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.data.map((row: any) => ({
    source: row.dimensions[0]?.name || "direct",
    visits: Math.round(row.metrics[0]),
  }));
}

export async function getYandexDevices(days = 30): Promise<YandexDeviceRow[]> {
  const data = await yandexFetch({
    dimensions: "ym:s:deviceCategory",
    metrics: "ym:s:visits",
    date1: `${days}daysAgo`,
    date2: "today",
    sort: "-ym:s:visits",
  });
  if (!data?.data) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.data.map((row: any) => ({
    device: row.dimensions[0]?.name || "desktop",
    visits: Math.round(row.metrics[0]),
  }));
}

export async function getYandexHours(days = 7): Promise<YandexHourRow[]> {
  const data = await yandexFetch({
    dimensions: "ym:s:hourOfDay",
    metrics: "ym:s:visits",
    date1: `${days}daysAgo`,
    date2: "today",
    sort: "ym:s:hourOfDay",
    limit: "24",
  });
  const hourMap: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourMap[h] = 0;
  if (data?.data) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.data.forEach((row: any) => {
      const h = parseInt(row.dimensions[0]?.name ?? "0");
      hourMap[h] = Math.round(row.metrics[0]);
    });
  }
  return Array.from({ length: 24 }, (_, h) => ({ hour: h, visits: hourMap[h] }));
}
