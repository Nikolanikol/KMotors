const BRANDS = [
  { name: 'Kia', svg: (
    <svg viewBox="0 0 100 50" fill="currentColor" className="h-8 md:h-10 w-auto">
      <path d="M20 10h8l12 15V10h8v30h-8L28 25v15h-8V10zm40 0h10l8 12 8-12h10L84 25l12 15h-10l-8-10-8 10H60l12-15L20 10zm-50 0h8v30h-8V10z" fill="white"/>
      <ellipse cx="88" cy="15" rx="5" ry="5" fill="white"/>
    </svg>
  )},
  { name: 'Hyundai', svg: (
    <svg viewBox="0 0 120 40" fill="currentColor" className="h-8 md:h-10 w-auto">
      <path d="M10 8h6v10h8V8h6v24h-6V20h-8v12h-6V8zm30 0h6v24h-6V8zm12 0h6l10 14V8h6v24h-6L58 18v14h-6V8zm36 0h6v10h8V8h6v24h-6V20h-8v12h-6V8z" fill="white"/>
      <path d="M95 5c-2 0-4 1-5 3l-3 5c-1 2 0 4 2 5l8 4c2 1 4 0 5-2l3-5c1-2 0-4-2-5l-8-4z" fill="white"/>
    </svg>
  )},
  { name: 'Genesis', svg: (
    <svg viewBox="0 0 140 36" fill="currentColor" className="h-7 md:h-9 w-auto">
      <path d="M8 6h20c6 0 10 4 10 10 0 4-2 7-5 9l7 11h-8l-6-10h-8v10H8V6zm8 14h10c3 0 5-2 5-4s-2-4-5-4H16v8zm30-14h8v30h-8V6zm14 0h8l14 18V6h8v30h-8L68 18v18h-8V6zm44 0h20c6 0 10 4 10 10v10c0 6-4 10-10 10h-8l-6 8h-8l6-8c-4-2-6-6-6-10V16c0-6 4-10 10-10h-8zm12 8c-3 0-5 2-5 4v10c0 3 2 4 5 4h8c3 0 5-2 5-4V18c0-3-2-4-5-4h-8z" fill="white"/>
    </svg>
  )},
  { name: 'SsangYong', svg: (
    <svg viewBox="0 0 160 30" fill="currentColor" className="h-6 md:h-8 w-auto">
      <path d="M5 5h8l5 12 5-12h8l-10 20h-6L5 5zm30 0h8v20h-8V5zm12 0h6l10 12V5h8v20h-6L55 13v12h-8V5zm32 0h20v6h-12v2h10v6h-10v6h-8V5zm26 0h20v6h-12v2h10v6h-10v6h-8V5z" fill="white"/>
    </svg>
  )},
  { name: 'KG Mobility', svg: (
    <svg viewBox="0 0 100 40" fill="currentColor" className="h-7 md:h-9 w-auto">
      <rect x="2" y="8" width="24" height="24" rx="4" fill="none" stroke="white" strokeWidth="2"/>
      <path d="M8 20h12M14 14v12" stroke="white" strokeWidth="2"/>
      <text x="32" y="26" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial">KG</text>
    </svg>
  )},
]

export default function BrandMarquee() {
  const duplicated = [...BRANDS, ...BRANDS, ...BRANDS]

  return (
    <div className="bg-[var(--axis-charcoal)] py-6 overflow-hidden relative">
      {/* Edge fade */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[var(--axis-charcoal)] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[var(--axis-charcoal)] to-transparent z-10" />

      <div
        className="flex items-center gap-20 whitespace-nowrap"
        style={{
          animation: 'marqueeScroll 30s linear infinite',
          width: 'max-content',
        }}
      >
        {duplicated.map((brand, i) => (
          <div
            key={`${brand.name}-${i}`}
            className="flex items-center justify-center min-w-[120px] opacity-50 hover:opacity-100 transition-opacity duration-300"
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
  )
}
