import React from "react";

const SocialRow = () => {
  return (
    <div className="flex justify-center gap-5 sm:gap-6">
      {/* WhatsApp */}
      <a
        href="https://wa.me/821058654344"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Написать в WhatsApp"
        className="group relative w-14 h-14 rounded-xl bg-gradient-to-br from-[#218a3f] to-[#1a7c2e] flex items-center justify-center text-white transition-all duration-300 cursor-pointer
          shadow-[0_8px_16px_rgba(0,0,0,0.15)]
          hover:shadow-[0_20px_32px_rgba(136,185,150,0.3),inset_-2px_-2px_8px_rgba(0,0,0,0.2),inset_2px_2px_8px_rgba(255,255,255,0.2)]
          hover:-translate-y-1"
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 relative z-10">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* Telegram */}
      <a
        href="https://t.me/avto_korea_nikolai"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Написать в Telegram"
        className="group relative w-14 h-14 rounded-xl bg-gradient-to-br from-[#7fbde7] to-[#093587] flex items-center justify-center text-white transition-all duration-300 cursor-pointer
          shadow-[0_8px_16px_rgba(0,0,0,0.15)]
          hover:shadow-[0_20px_32px_rgba(122,168,199,0.3),inset_-2px_-2px_8px_rgba(0,0,0,0.2),inset_2px_2px_8px_rgba(255,255,255,0.2)]
          hover:-translate-y-1"
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 relative z-10">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.48 13.617l-2.95-.924c-.64-.203-.654-.64.136-.948l11.52-4.44c.532-.194 1 .12.376.943z"/>
        </svg>
      </a>

      {/* Instagram */}
      <a
        href="https://www.instagram.com/axiskoreancar"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className="group relative w-14 h-14 rounded-xl bg-[linear-gradient(45deg,#f09433_0%,#e6683c_25%,#dc2743_50%,#cc2366_75%,#bc1888_100%)] flex items-center justify-center text-white transition-all duration-300 cursor-pointer
          shadow-[0_8px_16px_rgba(0,0,0,0.15)]
          hover:shadow-[0_20px_32px_rgba(220,39,67,0.3),inset_-2px_-2px_8px_rgba(0,0,0,0.2),inset_2px_2px_8px_rgba(255,255,255,0.2)]
          hover:-translate-y-1"
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 relative z-10">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.053 1.805.249 2.227.415.56.217.96.477 1.38.896.42.42.679.82.896 1.38.164.422.36 1.057.413 2.227.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.053 1.17-.249 1.805-.413 2.227-.217.56-.477.96-.896 1.38-.42.42-.82.679-1.38.896-.422.164-1.057.36-2.227.413-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.053-1.805-.249-2.227-.413-.56-.217-.96-.477-1.38-.896-.42-.42-.679-.82-.896-1.38-.164-.422-.36-1.057-.413-2.227-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.053-1.17.249-1.805.413-2.227.217-.56.477-.96.896-1.38.42-.42.82-.679 1.38-.896.422-.166 1.057-.362 2.227-.415 1.266-.058 1.646-.07 4.85-.07M12 0C8.741 0 8.332.014 7.052.072 5.775.132 4.903.335 4.14.63a5.88 5.88 0 00-2.126 1.384A5.88 5.88 0 00.63 4.14C.335 4.903.131 5.775.072 7.052.014 8.332 0 8.741 0 12s.014 3.668.072 4.948c.059 1.277.263 2.149.558 2.912a5.88 5.88 0 001.384 2.126 5.88 5.88 0 002.126 1.384c.763.295 1.635.499 2.912.558C8.332 23.986 8.741 24 12 24s3.668-.014 4.948-.072c1.277-.059 2.149-.263 2.912-.558a5.88 5.88 0 002.126-1.384 5.88 5.88 0 001.384-2.126c.295-.763.499-1.635.558-2.912.058-1.28.072-1.689.072-4.948s-.014-3.668-.072-4.948c-.059-1.277-.263-2.149-.558-2.912a5.88 5.88 0 00-1.384-2.126A5.88 5.88 0 0019.86.63c-.763-.295-1.635-.498-2.912-.558C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm7.846-10.405a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z"/>
        </svg>
      </a>
    </div>
  );
};

export default SocialRow;
