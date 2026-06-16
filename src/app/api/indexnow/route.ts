import { NextRequest, NextResponse } from "next/server";

const KEY = "53c31aeaa2814186b7f3922b24e9ca08";
const HOST = "https://www.kmotors.shop";
const ENDPOINT = "https://api.indexnow.org/indexnow";

export async function POST(req: NextRequest) {
  const adminSession = req.cookies.get("admin_session");
  if (!adminSession?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const urls: string[] = body.urls ?? [];

  if (urls.length === 0) {
    return NextResponse.json({ error: "No URLs provided" }, { status: 400 });
  }

  const fullUrls = urls.map((u: string) =>
    u.startsWith("http") ? u : `${HOST}${u.startsWith("/") ? "" : "/"}${u}`
  );

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      host: "www.kmotors.shop",
      key: KEY,
      keyLocation: `${HOST}/${KEY}.txt`,
      urlList: fullUrls,
    }),
  });

  return NextResponse.json({
    status: res.status,
    submitted: fullUrls.length,
    message: res.ok ? "Submitted to IndexNow" : await res.text(),
  });
}
