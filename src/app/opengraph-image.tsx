import { ImageResponse } from "next/og";

export const alt = "K-Axis — авто из Кореи";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#0A0A0A",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Orange glow background */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "800px",
            height: "400px",
            background: "radial-gradient(ellipse, rgba(255,69,0,0.18) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Left orange accent line */}
        <div
          style={{
            position: "absolute",
            left: "0",
            top: "0",
            bottom: "0",
            width: "6px",
            background: "linear-gradient(to bottom, #FF4500, #FF8C00)",
          }}
        />

        {/* Logo + Title row */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "24px" }}>
          {/* K-Axis SVG Logo */}
          <svg width="80" height="80" viewBox="0 0 36 36" fill="none">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="36" y2="36">
                <stop offset="0%" stopColor="#FF4500" />
                <stop offset="100%" stopColor="#FF8C00" />
              </linearGradient>
            </defs>
            <path d="M4 32L16 4H22L14 20L28 4H32L18 20L28 32H22L12 20L8 32H4Z" fill="url(#g)" />
            <path d="M20 4L32 4L24 14L20 4Z" fill="#FF6B1A" opacity="0.6" />
          </svg>

          {/* Brand name */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "72px", fontWeight: "800", letterSpacing: "-2px", color: "#F5F0EB", lineHeight: 1 }}>
              K<span style={{ color: "#FF4500" }}>-Axis</span>
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: "120px", height: "3px", background: "linear-gradient(to right, #FF4500, #FF8C00)", marginBottom: "28px", borderRadius: "2px" }} />

        {/* Tagline */}
        <div style={{ fontSize: "36px", fontWeight: "600", color: "#F5F0EB", marginBottom: "16px", letterSpacing: "-0.5px" }}>
          Автомобили из Кореи
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: "22px", color: "#8A8A8A", maxWidth: "700px", textAlign: "center" }}>
          Hyundai · Kia · Genesis — прямые поставки из Южной Кореи
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "60px", marginTop: "48px" }}>
          {[
            { num: "1240+", label: "авто в каталоге" },
            { num: "850+", label: "довольных клиентов" },
            { num: "12 лет", label: "на рынке" },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "32px", fontWeight: "800", color: "#FF4500" }}>{s.num}</span>
              <span style={{ fontSize: "14px", color: "#8A8A8A", textTransform: "uppercase", letterSpacing: "1px" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Domain */}
        <div style={{ position: "absolute", bottom: "32px", right: "48px", fontSize: "18px", color: "#4A4A4A" }}>
          kmotors.shop
        </div>
      </div>
    ),
    { ...size }
  );
}
