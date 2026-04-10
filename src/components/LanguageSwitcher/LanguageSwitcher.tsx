'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ka', name: 'ქართული', flag: '🇬🇪' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

const SUPPORTED_LANGS = languages.map((l) => l.code);

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(languages[0]);
  const [mounted, setMounted] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0, maxHeight: 400 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Detect current lang from URL
  useEffect(() => {
    setMounted(true);
    const segments = pathname.split('/');
    const urlLang = segments[1];
    const detected = SUPPORTED_LANGS.includes(urlLang)
      ? languages.find((l) => l.code === urlLang) || languages[0]
      : languages[0];
    setCurrentLanguage(detected);
  }, [pathname]);

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
        maxHeight: window.innerHeight - rect.bottom - 24,
      });
    }
  }, []);

  const handleOpen = () => {
    updatePosition();
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  const changeLanguage = (langCode: string) => {
    // Replace the lang segment in the URL: /ru/catalog/123 → /en/catalog/123
    const segments = pathname.split('/');
    if (SUPPORTED_LANGS.includes(segments[1])) {
      segments[1] = langCode;
    } else {
      segments.splice(1, 0, langCode);
    }
    const newPath = segments.join('/') || '/';

    // Update i18n state and cookie
    i18n.changeLanguage(langCode);
    document.cookie = `kmotors-lang=${langCode}; path=/; max-age=31536000; SameSite=Lax`;

    const lang = languages.find((l) => l.code === langCode) || languages[0];
    setCurrentLanguage(lang);
    setIsOpen(false);
    router.push(newPath);
  };

  if (!mounted) {
    return (
      <div className="relative">
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors">
          <Globe className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium">RU</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
        aria-label="Выбрать язык"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="text-sm font-medium hidden sm:inline">
          {currentLanguage.code.toUpperCase()}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] overflow-y-auto"
            style={{ top: dropdownPos.top, right: dropdownPos.right, maxHeight: dropdownPos.maxHeight }}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-orange-50 transition-colors ${
                  currentLanguage.code === lang.code
                    ? 'bg-orange-100 text-orange-700 font-semibold'
                    : 'text-gray-700'
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="text-sm">{lang.name}</span>
                {currentLanguage.code === lang.code && (
                  <svg
                    className="w-4 h-4 ml-auto text-orange-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
