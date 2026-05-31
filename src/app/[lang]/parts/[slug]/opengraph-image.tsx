import { ImageResponse } from "next/og";
import { createServerClient } from "@/lib/supabase";
import { parsePartSlug } from "@/utils/partSlug";

async function fetchPartData(slug: string) {
  try {
    const { partNumber, productId } = parsePartSlug(slug);

    const supabase = createServerClient();

    let query = supabase.from("parts_products").select("id, part_number, name_ru, name_en, image_url");

    if (productId !== null) {
      query = query.eq("id", productId);
    } else if (partNumber) {
      query = query.eq("part_number", partNumber);
    } else {
      return null;
    }

    const { data: p } = await query.single();
    return p;
  } catch {
    return null;
  }
}

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
            src={imageUrl}
            style={{ width: "100%", height: "400px", objectFit: "cover", borderRadius: "8px" }}
            alt={title}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <h1 style={{ fontSize: 32, margin: 0, color: "#002C5F" }}>{title}</h1>
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
          Оригинальные запчасти из Кореи
        </p>
      </div>
    ),
    { ...size },
  );
}
