import { NextRequest, NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

const KEY = "f0a070ba837a4a414a58457c67b26450";
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
    u.startsWith("http") ? u : `${SITE_URL}${u.startsWith("/") ? "" : "/"}${u}`
  );

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      host: "www.kmotors.shop",
      key: KEY,
      keyLocation: `${SITE_URL}/${KEY}.txt`,
      urlList: fullUrls,
    }),
  });

  return NextResponse.json({
    status: res.status,
    submitted: fullUrls.length,
    message: res.ok ? "Submitted to IndexNow" : await res.text(),
  });
}
