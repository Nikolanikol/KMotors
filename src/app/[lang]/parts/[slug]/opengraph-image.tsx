import { ImageResponse } from "next/og";
import { parsePartSlug } from "@/utils/partSlug";

async function fetchPartData(slug: string) {
  try {
    const { partNumber, productId } = parsePartSlug(slug);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    let filter: string;
    if (productId !== null) {
      filter = `id=eq.${productId}`;
    } else if (partNumber) {
      filter = `part_number=eq.${encodeURIComponent(partNumber)}`;
    } else {
      return null;
    }

    // Use fetch directly → Next.js кэширует автоматически на revalidate срок
    const res = await fetch(
      `${supabaseUrl}/rest/v1/parts_products?${filter}&select=id,part_number,name_ru,name_en,image_url&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 604800 },
        signal: AbortSignal.timeout(3000),
      }
    );

    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0] ?? null;
  } catch {
    return null;
  }
}

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 604800; // Cache for 1 week

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { slug } = await params;
  const part = await fetchPartData(slug);

  const title = part ? `${part.name_ru || part.name_en || "Запчасть"}` : "Запчасти K-Axis";
  const imageUrl = part?.image_url;

  if (imageUrl) {
    return new ImageResponse(
      (
        <div
          style={{
            background: "#f5f5f5",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "40px",
          }}
        >
          <img
            src={imageUrl}
            style={{ width: "100%", height: "420px", objectFit: "contain" }}
            alt={title}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <h1 style={{ fontSize: 28, margin: 0, color: "#002C5F", maxWidth: "800px" }}>
              {title}
            </h1>
            <p style={{ fontSize: 22, margin: 0, color: "#FF4500", fontWeight: 700 }}>K-Axis</p>
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
        <p style={{ fontSize: 28, margin: "16px 0 0 0", opacity: 0.8 }}>
          Оригинальные запчасти из Кореи
        </p>
      </div>
    ),
    { ...size },
  );
}
