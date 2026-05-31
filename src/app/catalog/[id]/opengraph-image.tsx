import { ImageResponse } from "next/og";

async function fetchCarData(id: string) {
  try {
    const res = await fetch(`https://api.encar.com/v1/readside/vehicle/${id}`, {
      next: { revalidate: 3600 },
    });
    return res.json();
  } catch {
    return null;
  }
}

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
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

  const photoUrl = data?.photos?.[0]?.location
    ? `https://ci.encar.com${data.photos[0].location}`
    : null;

  if (photoUrl) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: "white",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "40px",
          }}
        >
          <img
            src={photoUrl}
            style={{ width: "100%", height: "400px", objectFit: "cover", borderRadius: "8px" }}
            alt={carName}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <h1 style={{ fontSize: 32, margin: 0, color: "#002C5F" }}>{carName}</h1>
            <p style={{ fontSize: 20, margin: 0, color: "#666" }}>K-Axis</p>
          </div>
        </div>
      ),
      { ...size },
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
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
        <h1 style={{ fontSize: 48, margin: 0, textAlign: "center" }}>K-Axis</h1>
        <p style={{ fontSize: 24, margin: "20px 0 0 0", textAlign: "center" }}>
          Авто из Кореи
        </p>
      </div>
    ),
    { ...size },
  );
}
