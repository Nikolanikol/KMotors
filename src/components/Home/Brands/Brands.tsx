"use client";

const BRANDS = [
  { name: "Kia", svg: <svg viewBox="0 0 80 30" fill="currentColor" className="h-6 md:h-8 w-auto"><path d="M4 4h6l8 10V4h6v20H18L10 14v10H4V4zm26 0h6v20h-6V4zm10 0h6l8 10V4h6v20h-6L46 14v10h-6V4z" fill="white"/></svg> },
  { name: "Hyundai", svg: <svg viewBox="0 0 100 30" fill="currentColor" className="h-6 md:h-8 w-auto"><path d="M4 4h6v8h6V4h6v20h-6v-8h-6v8H4V4zm24 0h6v20h-6V4zm10 0h6l8 10V4h6v20h-6L48 14v10h-6V4zm28 0h6v8h6V4h6v20h-6v-8h-6v8h-6V4z" fill="white"/></svg> },
  { name: "Genesis", svg: <svg viewBox="0 0 100 30" fill="currentColor" className="h-6 md:h-8 w-auto"><path d="M4 4h16c4 0 8 3 8 8 0 3-2 6-4 7l5 7H22l-4-7H10v7H4V4zm6 10h8c2 0 4-1 4-3s-2-3-4-3h-8v6zm22-10h6v20h-6V4zm12 0h6l10 14V4h6v20h-6L54 10v14h-6V4zm30 0h16v5H80v3h8v5h-8v7h-6V4z" fill="white"/></svg> },
  { name: "SsangYong", svg: <svg viewBox="0 0 120 30" fill="currentColor" className="h-5 md:h-7 w-auto"><path d="M4 4h6l4 9 4-9h6l-8 14h-4L4 4zm24 0h6v20h-6V4zm10 0h5l8 10V4h6v20h-5L47 10v14h-6V4zm28 0h16v5H72v3h8v5h-8v5h12v5H66V4zm22 0h16v5H94v3h8v5h-8v5h12v5H88V4z" fill="white"/></svg> },
  { name: "KIA", svg: <svg viewBox="0 0 60 30" fill="currentColor" className="h-6 md:h-8 w-auto"><path d="M4 4h6v20H4V4zm10 0h6v8l8-8h8L26 14l10 10h-8l-6-8v8h-6V4z" fill="white"/></svg> },
  { name: "Renault", svg: <svg viewBox="0 0 60 50" fill="currentColor" className="h-8 md:h-10 w-auto"><path d="M30 2L10 15v20l20 13 20-13V15L30 2zm0 8l12 8v14l-12 8-12-8V18l12-8z" fill="white"/></svg> },
];

export default function Brands() {
  const duplicated = [...BRANDS, ...BRANDS, ...BRANDS];

  return (
    <div className="py-6 overflow-hidden relative" style={{ backgroundColor: "var(--axis-charcoal)" }}>
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10" style={{ background: "linear-gradient(to right, var(--axis-charcoal), transparent)" }} />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10" style={{ background: "linear-gradient(to left, var(--axis-charcoal), transparent)" }} />

      <div
        className="flex items-center gap-16 whitespace-nowrap"
        style={{ animation: "marqueeScroll 25s linear infinite", width: "max-content" }}
      >
        {duplicated.map((brand, i) => (
          <div
            key={`${brand.name}-${i}`}
            className="flex items-center justify-center min-w-[100px] transition-opacity duration-300"
            style={{ opacity: 0.4 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.4"; }}
          >
            {brand.svg}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marqueeScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
