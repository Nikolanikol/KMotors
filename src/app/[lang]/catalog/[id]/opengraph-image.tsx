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
export const contentType = "image/png";
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
  const photoUrl = firstPhoto?.path
    ? `https://ci.encar.com${firstPhoto.path}?impolicy=heightRate&rh=696&cw=1160&ch=696&cg=Center`
    : null;

  if (photoUrl) {
    return new ImageResponse(
      (
        <div
          style={{
            background: "#0a0a0a",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            position: "relative",
          }}
        >
          {/* Car photo as background */}
          <img
            src={photoUrl}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            alt={carName}
          />
          {/* Gradient overlay */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "220px",
              background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
              display: "flex",
            }}
          />
          {/* Text over photo */}
          <div
            style={{
              position: "relative",
              padding: "0 48px 36px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <p style={{ fontSize: 20, margin: 0, color: "#FF4500", fontWeight: 700, letterSpacing: 2 }}>
              K-AXIS
            </p>
            <h1 style={{ fontSize: 40, margin: 0, color: "white", fontWeight: 700, lineHeight: 1.2 }}>
              {carName}
            </h1>
          </div>
        </div>
      ),
      { ...size },
    );
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
