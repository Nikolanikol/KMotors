const PROPERTY_ID = process.env.GA4_PROPERTY_ID || "504496694";
const BASE_URL = `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`;

async function getAccessToken(): Promise<string | null> {
  const clientId     = process.env.GA4_CLIENT_ID;
  const clientSecret = process.env.GA4_CLIENT_SECRET;
  const refreshToken = process.env.GA4_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.log("[GA4] ❌ GA4_CLIENT_ID / GA4_CLIENT_SECRET / GA4_REFRESH_TOKEN не найдены в .env");
    return null;
  }
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type:    "refresh_token",
      }),
    });
    const data = await res.json();
    if (!data.access_token) {
      console.error("[GA4] токен не получен:", JSON.stringify(data));
    }
    return data.access_token ?? null;
  } catch (e) {
    console.error("[GA4] ошибка получения токена:", e);
    return null;
  }
}

async function ga4Fetch(body: object) {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[GA4] API ошибка:", res.status, err);
      return null;
    }
    return res.json();
  } catch {
    return null;
  }
}

export interface GA4Summary {
  users: number;
  sessions: number;
  bounceRate: number;
  avgDuration: number;
}

export interface GA4GeoRow   { country: string; users: number; sessions: number }
export interface GA4DayRow   { date: string;    users: number; sessions: number }
export interface GA4SourceRow { source: string;  sessions: number }
export interface GA4DeviceRow { device: string;  sessions: number }
export interface GA4PageRow   { page: string;    views: number }

export async function getGA4Summary(days = 30): Promise<GA4Summary | null> {
  const data = await ga4Fetch({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "bounceRate" },
      { name: "averageSessionDuration" },
    ],
  });
  if (!data?.rows?.[0]) return null;
  const v = data.rows[0].metricValues;
  return {
    users:       Math.round(parseFloat(v[0].value)),
    sessions:    Math.round(parseFloat(v[1].value)),
    bounceRate:  Math.round(parseFloat(v[2].value)),
    avgDuration: Math.round(parseFloat(v[3].value)),
  };
}

export async function getGA4Geo(days = 30): Promise<GA4GeoRow[]> {
  const data = await ga4Fetch({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "country" }],
    metrics: [{ name: "activeUsers" }, { name: "sessions" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 10,
  });
  if (!data?.rows) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.rows.map((r: any) => ({
    country:  r.dimensionValues[0].value,
    users:    Math.round(parseFloat(r.metricValues[0].value)),
    sessions: Math.round(parseFloat(r.metricValues[1].value)),
  }));
}

export async function getGA4Daily(days = 14): Promise<GA4DayRow[]> {
  const data = await ga4Fetch({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "activeUsers" }, { name: "sessions" }],
    orderBys: [{ dimension: { dimensionName: "date" } }],
  });
  if (!data?.rows) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.rows.map((r: any) => ({
    date:     r.dimensionValues[0].value, // YYYYMMDD
    users:    Math.round(parseFloat(r.metricValues[0].value)),
    sessions: Math.round(parseFloat(r.metricValues[1].value)),
  }));
}

export async function getGA4Sources(days = 30): Promise<GA4SourceRow[]> {
  const data = await ga4Fetch({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "sessionDefaultChannelGrouping" }],
    metrics: [{ name: "sessions" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 8,
  });
  if (!data?.rows) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.rows.map((r: any) => ({
    source:   r.dimensionValues[0].value,
    sessions: Math.round(parseFloat(r.metricValues[0].value)),
  }));
}

export async function getGA4Devices(days = 30): Promise<GA4DeviceRow[]> {
  const data = await ga4Fetch({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "deviceCategory" }],
    metrics: [{ name: "sessions" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
  });
  if (!data?.rows) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.rows.map((r: any) => ({
    device:   r.dimensionValues[0].value,
    sessions: Math.round(parseFloat(r.metricValues[0].value)),
  }));
}

export async function getGA4TopPages(days = 7): Promise<GA4PageRow[]> {
  const data = await ga4Fetch({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 10,
  });
  if (!data?.rows) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.rows.map((r: any) => ({
    page:  r.dimensionValues[0].value,
    views: Math.round(parseFloat(r.metricValues[0].value)),
  }));
}
