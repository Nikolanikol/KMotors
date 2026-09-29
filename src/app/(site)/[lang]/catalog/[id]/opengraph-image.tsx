import { ImageResponse } from "next/og";

const TYPE_ORDER: Record<string, number> = { OUTER: 0, OPTION: 1, INNER: 2 };

async function fetchCarData(id: string) {
  // Primary: direct Encar API
  try {
    const res = await fetch(`https://api.encar.com/v1/readside/vehicle/${id}`, {
      next: { revalidate: 604800 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`Encar ${res.status}`);
    return await res.json();
  } catch {
    // Fallback: proxy (same as main page)
    try {
      const res = await fetch(
        `https://encar-proxy-main.onrender.com/api/vehicle/${id}`,
        { next: { revalidate: 604800 }, signal: AbortSignal.timeout(3000) }
      );
      if (!res.ok) throw new Error(`proxy ${res.status}`);
      return await res.json();
    } catch {
      return null;
    }
  }
}

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";
export const revalidate = 604800; // Cache for 1 week

export default async function Image({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { id } = await params;
  const data = await fetchCarData(id);

  const carName = data
    ? [
        data.category?.manufacturerEnglishName,
        data.category?.modelGroupEnglishName,
        data.category?.gradeEnglishName,
      ]
        .filter(Boolean)
        .join(" ")
    : "K-Axis";

  // Sort photos same way as Carousel on the page (OUTER first)
  const sortedPhotos = [...(data?.photos || [])].sort((a: any, b: any) => {
    const typeA = TYPE_ORDER[a.type] ?? 1;
    const typeB = TYPE_ORDER[b.type] ?? 1;
    if (typeA !== typeB) return typeA - typeB;
    return (a.code || "").localeCompare(b.code || "", undefined, { numeric: true });
  });

  // Use .path (not .location) — that's what API returns
  const firstPhoto = sortedPhotos[0];
  // Serve JPEG directly — avoids PNG bloat, stays under WhatsApp's ~300KB limit
  const photoUrl = firstPhoto?.path
    ? `https://ci.encar.com${firstPhoto.path}?impolicy=heightRate&rh=630&cw=1200&ch=630&cg=Center`
    : null;

  if (photoUrl) {
    try {
      const imgRes = await fetch(photoUrl, { signal: AbortSignal.timeout(3000) });
      if (imgRes.ok) {
        const buffer = await imgRes.arrayBuffer();
        return new Response(buffer, {
          headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "public, max-age=604800, immutable",
          },
        });
      }
    } catch {
      // fall through to branded fallback
    }
  }

  // Fallback: branded gradient
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #002C5F 0%, #BB162B 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
        }}
      >
        <h1 style={{ fontSize: 64, margin: 0, fontWeight: 700 }}>K-Axis</h1>
        <p style={{ fontSize: 28, margin: "16px 0 0 0", opacity: 0.8 }}>Авто из Кореи</p>
      </div>
    ),
    { ...size },
  );
}
