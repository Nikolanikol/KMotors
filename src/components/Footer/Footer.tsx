"use client";
import {
  FaInstagram,
  FaWhatsapp,
  FaTelegramPlane,
  FaTiktok,
} from "react-icons/fa";
import { Mail, Phone, MapPin, ArrowUp } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-white mt-20 relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500"></div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Column 1 - Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-orange-500">K</span>Motors
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Ваш надёжный партнёр в покупке автомобилей из Южной Кореи.
              Hyundai, Kia, Genesis — лучшие цены и качество.
            </p>
            <div className="flex items-center gap-2 text-gray-400 text-xs">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span>Южная Корея → Россия</span>
            </div>
          </div>

          {/* Column 2 - Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-white mb-4">Навигация</h4>
            <nav className="space-y-2">
              <Link
                href="/"
                className="block text-gray-400 hover:text-orange-500 transition-colors text-sm"
              >
                Главная
              </Link>
              <Link
                href="/catalog"
                className="block text-gray-400 hover:text-orange-500 transition-colors text-sm"
              >
                Каталог автомобилей
              </Link>
              <Link
                href="/how-to-buy"
                className="block text-gray-400 hover:text-orange-500 transition-colors text-sm"
              >
                Как купить
              </Link>
              <Link
                href="/contact"
                className="block text-gray-400 hover:text-orange-500 transition-colors text-sm"
              >
                Контакты
              </Link>
            </nav>
          </div>

          {/* Column 3 - Contacts */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-white mb-4">Контакты</h4>
            <div className="space-y-3">
              <a
                href={`tel:${process.env.NEXT_PUBLIC_NUMBER_PHONE}`}
                className="flex items-center gap-3 text-gray-400 hover:text-orange-500 transition-colors text-sm group"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <span>{process.env.NEXT_PUBLIC_NUMBER_PHONE}</span>
              </a>
              <a
                href="mailto:info@kmotors.shop"
                className="flex items-center gap-3 text-gray-400 hover:text-orange-500 transition-colors text-sm group"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <span>info@kmotors.shop</span>
              </a>
            </div>

            {/* Social Links */}
            <div className="pt-4">
              <h5 className="text-sm font-semibold text-gray-400 mb-3">
                Мы в соцсетях
              </h5>
              <div className="flex gap-3">
                <a
                  href="https://instagram.com/kmotorrss"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#d084a8] to-[#c27080] flex items-center justify-center text-white transition-all duration-300 cursor-pointer
                    shadow-[0_4px_12px_rgba(0,0,0,0.15)]
                    hover:shadow-[0_12px_24px_rgba(208,132,168,0.3),inset_-2px_-2px_8px_rgba(0,0,0,0.2),inset_2px_2px_8px_rgba(255,255,255,0.2)]
                    hover:-translate-y-1"
                  aria-label="Instagram"
                >
                  <FaInstagram size={18} />
                </a>

                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_NUMBER_PHONE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#88b996] to-[#6fa77a] flex items-center justify-center text-white transition-all duration-300 cursor-pointer
                    shadow-[0_4px_12px_rgba(0,0,0,0.15)]
                    hover:shadow-[0_12px_24px_rgba(136,185,150,0.3),inset_-2px_-2px_8px_rgba(0,0,0,0.2),inset_2px_2px_8px_rgba(255,255,255,0.2)]
                    hover:-translate-y-1"
                  aria-label="WhatsApp"
                >
                  <FaWhatsapp size={18} />
                </a>

                <a
                  href="https://t.me/tirlye"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#7aa8c7] to-[#5a8fb0] flex items-center justify-center text-white transition-all duration-300 cursor-pointer
                    shadow-[0_4px_12px_rgba(0,0,0,0.15)]
                    hover:shadow-[0_12px_24px_rgba(122,168,199,0.3),inset_-2px_-2px_8px_rgba(0,0,0,0.2),inset_2px_2px_8px_rgba(255,255,255,0.2)]
                    hover:-translate-y-1"
                  aria-label="Telegram"
                >
                  <FaTelegramPlane size={18} />
                </a>

                <a
                  href="https://www.tiktok.com/@kmotorrss"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white transition-all duration-300 cursor-pointer
                    shadow-[0_4px_12px_rgba(0,0,0,0.15)]
                    hover:shadow-[0_12px_24px_rgba(100,100,100,0.3),inset_-2px_-2px_8px_rgba(0,0,0,0.2),inset_2px_2px_8px_rgba(255,255,255,0.2)]
                    hover:-translate-y-1"
                  aria-label="TikTok"
                >
                  <FaTiktok size={18} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-6 mt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-xs text-center md:text-left">
              © {new Date().getFullYear()} KMotors. Все права защищены.
              <span className="mx-2">|</span>
              <Link
                href="/privacy"
                className="hover:text-orange-500 transition-colors"
              >
                Политика конфиденциальности
              </Link>
            </div>

            {/* Scroll to Top Button */}
            <button
              onClick={scrollToTop}
              className="group flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-all text-sm font-semibold shadow-lg hover:shadow-xl"
              aria-label="Наверх"
            >
              <span>Наверх</span>
              <ArrowUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
    </footer>
  );
}
