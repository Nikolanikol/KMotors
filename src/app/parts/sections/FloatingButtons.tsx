"use client";

export function FloatingButtons() {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
      <a
        href="https://wa.me/821058654344"
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        aria-label="WhatsApp"
      >
        <svg viewBox="0 0 32 32" className="w-7 h-7 fill-white">
          <path d="M16.004 3.2C9.054 3.2 3.404 8.85 3.404 15.8c0 2.22.58 4.39 1.68 6.3L3.2 28.8l6.93-1.82a12.56 12.56 0 006.87 1.02h.004c6.95 0 12.6-5.65 12.6-12.6s-5.65-12.2-12.6-12.2zm0 23.04a10.4 10.4 0 01-5.31-1.46l-.38-.23-3.95 1.04 1.05-3.85-.25-.39A10.39 10.39 0 015.56 15.8c0-5.76 4.69-10.44 10.45-10.44 5.76 0 10.44 4.68 10.44 10.44 0 5.77-4.68 10.44-10.44 10.44zm5.73-7.83c-.32-.16-1.87-.92-2.16-1.03-.29-.1-.5-.16-.71.16s-.82 1.03-1 1.24c-.19.2-.37.23-.69.08-.32-.16-1.34-.5-2.56-1.58-.94-.84-1.58-1.88-1.77-2.2-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.18.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.71-1.71-.97-2.34-.26-.61-.52-.53-.71-.54h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.64 0 1.56 1.14 3.06 1.3 3.27.16.21 2.24 3.42 5.43 4.79.76.33 1.35.52 1.81.67.76.24 1.46.2 2.01.13.61-.09 1.87-.77 2.14-1.51.26-.74.26-1.38.18-1.51-.08-.13-.29-.21-.61-.37z" />
        </svg>
      </a>
      <a
        href="https://t.me/avto_korea_nikolai"
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 rounded-full bg-[#0088cc] flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        aria-label="Telegram"
      >
        <svg viewBox="0 0 32 32" className="w-7 h-7 fill-white">
          <path d="M26.07 5.26l-3.75 19.32c-.27 1.3-.99 1.62-2.02 1.01l-5.6-4.13-2.7 2.6c-.3.3-.55.55-1.13.55l.4-5.73L22.1 8.93c.47-.42-.1-.65-.73-.23L8.46 17.6l-5.53-1.73c-1.2-.37-1.22-1.2.25-1.78L24.6 3.53c1-.37 1.87.23 1.47 1.73z" />
        </svg>
      </a>
    </div>
  );
}
