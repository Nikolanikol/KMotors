"use client";

import {
  FaInstagram,
  FaWhatsapp,
  FaTelegramPlane,
  FaTiktok,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-sm text-gray-600 mt-12 ">
      <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          © {new Date().getFullYear()} Nikolai Auto Export. Все права защищены.
        </div>
        <div className="flex gap-4 text-xl">
          <a
            href="https://instagram.com/kmotorrss"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-800"
          >
            <FaInstagram />
          </a>
          <a
            href="https://wa.me/+821077324344"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-800"
          >
            <FaWhatsapp />
          </a>
          <a
            href="https://t.me/tirlye"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-800"
          >
            <FaTelegramPlane />
          </a>
          <a
            href="https://www.tiktok.com/@kmotorrss"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-800"
          >
            <FaTiktok />
          </a>
        </div>
      </div>
    </footer>
  );
}
