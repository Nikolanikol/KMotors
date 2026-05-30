const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kmotors.shop";

// Кэш токена на время жизни процесса (сбрасывается при редеплое)
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const clientId     = process.env.GA4_CLIENT_ID;
  const clientSecret = process.env.GA4_CLIENT_SECRET;
  const refreshToken = process.env.GA4_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;
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
    if (data.access_token) {
      cachedToken = data.access_token;
      // expires_in обычно 3600 сек, обновляем за 5 минут до истечения
      tokenExpiresAt = Date.now() + ((data.expires_in ?? 3600) - 300) * 1000;
    }
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

async function scFetch(endpoint: string, body: object) {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const res = await fetch(`https://searchconsole.googleapis.com/webmasters/v3${endpoint}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[GSC] API ошибка:", res.status, err.slice(0, 200));
      return null;
    }
    return res.json();
  } catch (e) {
    console.error("[GSC] ошибка:", e);
    return null;
  }
}

export interface GSCQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCPageRow {
  page: string;
  clicks: number;
  impressions: number;
}

export interface GSCCountryRow {
  country: string;
  clicks: number;
  impressions: number;
}

export async function getTopQueries(days = 28): Promise<GSCQueryRow[]> {
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
  const data = await scFetch(`/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`, {
    startDate,
    endDate,
    dimensions: ["query"],
    rowLimit: 20,
    orderBy: [{ fieldName: "clicks", sortOrder: "DESCENDING" }],
  });
  if (!data?.rows) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.rows.map((r: any) => ({
    query:       r.keys[0],
    clicks:      Math.round(r.clicks),
    impressions: Math.round(r.impressions),
    ctr:         Math.round(r.ctr * 100),
    position:    Math.round(r.position * 10) / 10,
  }));
}

export async function getTopPages(days = 28): Promise<GSCPageRow[]> {
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
  const data = await scFetch(`/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`, {
    startDate,
    endDate,
    dimensions: ["page"],
    rowLimit: 10,
    orderBy: [{ fieldName: "clicks", sortOrder: "DESCENDING" }],
  });
  if (!data?.rows) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.rows.map((r: any) => ({
    page:        r.keys[0].replace(SITE_URL, ""),
    clicks:      Math.round(r.clicks),
    impressions: Math.round(r.impressions),
  }));
}

export async function getTopCountries(days = 28): Promise<GSCCountryRow[]> {
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
  const data = await scFetch(`/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`, {
    startDate,
    endDate,
    dimensions: ["country"],
    rowLimit: 10,
    orderBy: [{ fieldName: "clicks", sortOrder: "DESCENDING" }],
  });
  if (!data?.rows) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.rows.map((r: any) => ({
    country:     r.keys[0],
    clicks:      Math.round(r.clicks),
    impressions: Math.round(r.impressions),
  }));
}
