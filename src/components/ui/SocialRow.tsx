import React from "react";
import { FaInstagram, FaTelegramPlane, FaWhatsapp } from "react-icons/fa";

const SocialRow = () => {
  return (
    <div className="flex justify-end gap-6">
      {/* Instagram */}
      <a
        href="https://instagram.com/kmotorrss"
        target="_blank"
        rel="noopener noreferrer"
        className="group relative w-14 h-14 rounded-xl bg-gradient-to-br from-[#991f1f] to-[#7f0606] flex items-center justify-center text-white transition-all duration-300 cursor-pointer
          shadow-[0_8px_16px_rgba(0,0,0,0.15)]
          hover:shadow-[0_20px_32px_rgba(208,132,168,0.3),inset_-2px_-2px_8px_rgba(0,0,0,0.2),inset_2px_2px_8px_rgba(255,255,255,0.2)]
          hover:-translate-y-1"
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <FaInstagram size={24} className="relative z-10" />
      </a>

      {/* WhatsApp */}
      <a
        href={`https://wa.me/${process.env.NEXT_PUBLIC_NUMBER_PHONE}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative w-14 h-14 rounded-xl bg-gradient-to-br from-[#218a3f] to-[#1a7c2e] flex items-center justify-center text-white transition-all duration-300 cursor-pointer
          shadow-[0_8px_16px_rgba(0,0,0,0.15)]
          hover:shadow-[0_20px_32px_rgba(136,185,150,0.3),inset_-2px_-2px_8px_rgba(0,0,0,0.2),inset_2px_2px_8px_rgba(255,255,255,0.2)]
          hover:-translate-y-1"
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <FaWhatsapp size={24} className="relative z-10" />
      </a>

      {/* Telegram */}
      <a
        href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative w-14 h-14 rounded-xl bg-gradient-to-br from-[#7fbde7] to-[#093587] flex items-center justify-center text-white transition-all duration-300 cursor-pointer
          shadow-[0_8px_16px_rgba(0,0,0,0.15)]
          hover:shadow-[0_20px_32px_rgba(122,168,199,0.3),inset_-2px_-2px_8px_rgba(0,0,0,0.2),inset_2px_2px_8px_rgba(255,255,255,0.2)]
          hover:-translate-y-1"
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <FaTelegramPlane size={24} className="relative z-10" />
      </a>
    </div>
  );
};

export default SocialRow;
