// BrandLogo — simplified monochrome brand emblems (currentColor).
// Deliberately minimal marks so they sit cleanly in the dark UI and can be
// tinted on hover. Falls back to a generic car glyph for unknown brands.
import { Car } from "lucide-react";

interface Props {
  brand: string;
  className?: string;
}

export function BrandLogo({ brand, className = "w-5 h-5" }: Props) {
  switch (brand) {
    case "hyundai":
      // Tilted "H" inside an oval — Hyundai's emblem, simplified.
      return (
        <svg viewBox="0 0 64 40" className={className} fill="none" stroke="currentColor" aria-hidden="true">
          <ellipse cx="32" cy="20" rx="29" ry="16" strokeWidth="2.5" />
          <path
            d="M23 12 L19 28 M45 12 L41 28 M21 20 C28 22.5 36 17.5 43 20"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "kia":
      // Classic oval "KIA" emblem, simplified.
      return (
        <svg viewBox="0 0 72 40" className={className} fill="none" aria-hidden="true">
          <ellipse cx="36" cy="20" rx="33" ry="16" stroke="currentColor" strokeWidth="2.5" />
          <text
            x="36"
            y="20"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="17"
            fontWeight="800"
            letterSpacing="0.5"
            fill="currentColor"
            fontFamily="system-ui, sans-serif"
          >
            KIA
          </text>
        </svg>
      );
    case "genesis":
      // Winged crest — Genesis emblem, simplified to tapering feather strokes.
      return (
        <svg viewBox="0 0 64 40" className={className} fill="none" stroke="currentColor" aria-hidden="true">
          <g strokeWidth="2" strokeLinecap="round">
            {/* central shield */}
            <path d="M32 10 L36 30 L28 30 Z" strokeLinejoin="round" />
            {/* left wing */}
            <path d="M27 15 C18 13 10 15 3 19" />
            <path d="M28 20 C20 19 13 20 7 23" />
            {/* right wing */}
            <path d="M37 15 C46 13 54 15 61 19" />
            <path d="M36 20 C44 19 51 20 57 23" />
          </g>
        </svg>
      );
    default:
      return <Car className={className} aria-hidden="true" />;
  }
}
