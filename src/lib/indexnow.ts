// IndexNow — уведомление Bing/Яндекс об изменённых URL (мгновенный пере-обход).
// Google в IndexNow не участвует — для него работает sitemap + revalidate.
//
// Ключ и хост совпадают с существующим /api/indexnow (ключ лежит в /{KEY}.txt).

const KEY = "f0a070ba837a4a414a58457c67b26450";
const HOST = "https://www.kmotors.shop";
const ENDPOINT = "https://api.indexnow.org/indexnow";
const BATCH = 10_000; // лимит IndexNow на один запрос

/** Отправляет список URL (абсолютных или относительных) в IndexNow. */
export async function submitIndexNow(
  urls: string[]
): Promise<{ ok: boolean; submitted: number; status: number | null }> {
  const full = [...new Set(urls)].map((u) =>
    u.startsWith("http") ? u : `${HOST}${u.startsWith("/") ? "" : "/"}${u}`
  );
  if (full.length === 0) return { ok: true, submitted: 0, status: null };

  let lastStatus = 200;
  for (let i = 0; i < full.length; i += BATCH) {
    const chunk = full.slice(i, i + BATCH);
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: "www.kmotors.shop",
        key: KEY,
        keyLocation: `${HOST}/${KEY}.txt`,
        urlList: chunk,
      }),
    });
    lastStatus = res.status;
    if (!res.ok) {
      console.error("[indexnow]", res.status, await res.text().catch(() => ""));
      return { ok: false, submitted: i, status: res.status };
    }
  }
  return { ok: true, submitted: full.length, status: lastStatus };
}
