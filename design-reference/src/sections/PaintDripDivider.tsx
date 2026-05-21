export default function PaintDripDivider() {
  return (
    <div className="w-full overflow-hidden" style={{ height: '40px' }}>
      <svg
        viewBox="0 0 1440 40"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="dividerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF4500" />
            <stop offset="100%" stopColor="#FF8C00" />
          </linearGradient>
        </defs>
        {/* Base line */}
        <rect x="0" y="0" width="1440" height="4" fill="url(#dividerGrad)" />
        {/* Drips */}
        <path d="M40 4 Q40 20, 40 30 Q40 38, 45 32 Q50 25, 50 4" fill="url(#dividerGrad)" opacity="0.9">
          <animateTransform attributeName="transform" type="scale" values="1,1;1,1.1;1,1" dur="3s" repeatCount="indefinite" additive="sum" />
        </path>
        <path d="M180 4 Q180 18, 180 26 Q180 34, 185 28 Q190 22, 190 4" fill="url(#dividerGrad)" opacity="0.8">
          <animateTransform attributeName="transform" type="scale" values="1,1;1,1.08;1,1" dur="2.5s" repeatCount="indefinite" additive="sum" />
        </path>
        <path d="M350 4 Q350 22, 350 34 Q350 40, 358 35 Q366 28, 366 4" fill="url(#dividerGrad)" opacity="0.95">
          <animateTransform attributeName="transform" type="scale" values="1,1;1,1.12;1,1" dur="3.2s" repeatCount="indefinite" additive="sum" />
        </path>
        <path d="M520 4 Q520 16, 520 24 Q520 30, 524 26 Q528 20, 528 4" fill="url(#dividerGrad)" opacity="0.7">
          <animateTransform attributeName="transform" type="scale" values="1,1;1,1.06;1,1" dur="2.8s" repeatCount="indefinite" additive="sum" />
        </path>
        <path d="M700 4 Q700 25, 700 36 Q700 40, 708 34 Q716 26, 716 4" fill="url(#dividerGrad)" opacity="0.9">
          <animateTransform attributeName="transform" type="scale" values="1,1;1,1.1;1,1" dur="3.5s" repeatCount="indefinite" additive="sum" />
        </path>
        <path d="M880 4 Q880 15, 880 22 Q880 28, 884 24 Q888 18, 888 4" fill="url(#dividerGrad)" opacity="0.75">
          <animateTransform attributeName="transform" type="scale" values="1,1;1,1.09;1,1" dur="2.6s" repeatCount="indefinite" additive="sum" />
        </path>
        <path d="M1050 4 Q1050 20, 1050 32 Q1050 38, 1056 33 Q1062 26, 1062 4" fill="url(#dividerGrad)" opacity="0.85">
          <animateTransform attributeName="transform" type="scale" values="1,1;1,1.11;1,1" dur="3s" repeatCount="indefinite" additive="sum" />
        </path>
        <path d="M1220 4 Q1220 17, 1220 25 Q1220 32, 1225 27 Q1230 20, 1230 4" fill="url(#dividerGrad)" opacity="0.8">
          <animateTransform attributeName="transform" type="scale" values="1,1;1,1.07;1,1" dur="2.7s" repeatCount="indefinite" additive="sum" />
        </path>
        <path d="M1380 4 Q1380 23, 1380 35 Q1380 40, 1388 34 Q1396 26, 1396 4" fill="url(#dividerGrad)" opacity="0.9">
          <animateTransform attributeName="transform" type="scale" values="1,1;1,1.1;1,1" dur="3.3s" repeatCount="indefinite" additive="sum" />
        </path>
      </svg>
    </div>
  )
}
