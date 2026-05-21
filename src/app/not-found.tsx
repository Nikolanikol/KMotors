"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle, Home, Search, MessageCircle } from "lucide-react";

const SUPPORTED_LANGS = ["ru", "en", "ko", "ka", "ar"];

const T = {
  ru: {
    title: "Страница не найдена",
    subtitle: "Похоже, вы попали на дорогу, которой нет на нашей карте",
    hint: "Пожалуйста, проверьте URL или вернитесь на главную страницу",
    home: "На главную", homeDesc: "Вернитесь на главную страницу K-Axis",
    catalog: "В каталог", catalogDesc: "Посмотрите наши автомобили из Кореи",
    help: "Что-то пошло не так?",
    helpDesc: "Если вы уверены, что эта страница должна существовать, свяжитесь с нашей командой",
    telegram: "Написать в Telegram", instagram: "Написать в Instagram",
    popular: "Популярные разделы:", howToBuy: "Как купить", about: "О компании", contacts: "Контакты",
  },
  en: {
    title: "Page Not Found",
    subtitle: "Looks like you've taken a road that isn't on our map",
    hint: "Please check the URL or return to the homepage",
    home: "Go Home", homeDesc: "Return to K-Axis homepage",
    catalog: "Browse Catalog", catalogDesc: "Explore our Korean cars",
    help: "Something went wrong?",
    helpDesc: "If you believe this page should exist, contact our team",
    telegram: "Write on Telegram", instagram: "Write on Instagram",
    popular: "Popular sections:", howToBuy: "How to Buy", about: "About", contacts: "Contacts",
  },
  ko: {
    title: "페이지를 찾을 수 없습니다",
    subtitle: "지도에 없는 길로 오신 것 같습니다",
    hint: "URL을 확인하거나 홈페이지로 돌아가세요",
    home: "홈으로", homeDesc: "K-Axis 홈페이지로 돌아가기",
    catalog: "카탈로그", catalogDesc: "한국 자동차를 둘러보세요",
    help: "문제가 발생했나요?",
    helpDesc: "이 페이지가 존재해야 한다고 생각되시면 팀에 연락하세요",
    telegram: "텔레그램으로 쓰기", instagram: "인스타그램으로 쓰기",
    popular: "인기 섹션:", howToBuy: "구매 방법", about: "회사 소개", contacts: "연락처",
  },
  ka: {
    title: "გვერდი ვერ მოიძებნა",
    subtitle: "როგორც ჩანს, თქვენ გზაზე ხართ, რომელიც ჩვენს რუკაზე არ არის",
    hint: "გთხოვთ შეამოწმოთ URL ან დაბრუნდეთ მთავარ გვერდზე",
    home: "მთავარზე", homeDesc: "K-Axis მთავარ გვერდზე დაბრუნება",
    catalog: "კატალოგი", catalogDesc: "იხილეთ კორეული ავტომობილები",
    help: "რაღაც არასწორია?",
    helpDesc: "თუ ფიქრობთ, რომ ეს გვერდი უნდა არსებობდეს, დაგვიკავშირდით",
    telegram: "Telegram-ზე წერა", instagram: "Instagram-ზე წერა",
    popular: "პოპულარული განყოფილებები:", howToBuy: "როგორ ვიყიდო", about: "კომპანიის შესახებ", contacts: "კონტაქტი",
  },
  ar: {
    title: "الصفحة غير موجودة",
    subtitle: "يبدو أنك سلكت طريقًا غير موجود على خريطتنا",
    hint: "يرجى التحقق من الرابط أو العودة إلى الصفحة الرئيسية",
    home: "الرئيسية", homeDesc: "العودة إلى الصفحة الرئيسية لـ K-Axis",
    catalog: "الكتالوج", catalogDesc: "تصفح سياراتنا الكورية",
    help: "هل حدث خطأ ما؟",
    helpDesc: "إذا كنت تعتقد أن هذه الصفحة يجب أن تكون موجودة، تواصل مع فريقنا",
    telegram: "الكتابة على Telegram", instagram: "الكتابة على Instagram",
    popular: "الأقسام الشائعة:", howToBuy: "كيفية الشراء", about: "عن الشركة", contacts: "اتصل بنا",
  },
};

const CardLink = ({ href, icon: Icon, title, desc }: { href: string; icon: any; title: string; desc: string }) => (
  <Link href={href}>
    <div
      className="rounded-2xl p-6 cursor-pointer transition-all duration-200"
      style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--axis-orange)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(74,74,74,0.3)"; }}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "rgba(255,69,0,0.12)" }}>
          <Icon className="w-6 h-6" style={{ color: "var(--axis-orange)" }} />
        </div>
        <div className="text-left">
          <h3 className="font-bold mb-1" style={{ color: "var(--axis-white)" }}>{title}</h3>
          <p className="text-sm" style={{ color: "var(--axis-gray)" }}>{desc}</p>
        </div>
      </div>
    </div>
  </Link>
);

export default function NotFound() {
  const pathname = usePathname();
  const segments = pathname?.split("/") ?? [];
  const lang = SUPPORTED_LANGS.includes(segments[1]) ? segments[1] : "ru";
  const t = T[lang as keyof typeof T] || T.ru;
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" dir={dir}
      style={{ backgroundColor: "var(--axis-black)" }}>
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-8"
            style={{ backgroundColor: "rgba(255,69,0,0.12)" }}>
            <AlertCircle className="w-12 h-12" style={{ color: "var(--axis-orange)" }} />
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-4" style={{ color: "var(--axis-white)" }}>404</h1>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--axis-white)" }}>{t.title}</h2>
          <p className="text-lg mb-2" style={{ color: "var(--axis-gray)" }}>{t.subtitle}</p>
          <p style={{ color: "var(--axis-gray)" }}>{t.hint}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <CardLink href={`/${lang}/`} icon={Home} title={t.home} desc={t.homeDesc} />
          <CardLink href={`/${lang}/catalog`} icon={Search} title={t.catalog} desc={t.catalogDesc} />
        </div>

        <div className="rounded-2xl p-8" style={{ backgroundColor: "rgba(255,69,0,0.08)", border: "1px solid rgba(255,69,0,0.25)" }}>
          <div className="flex items-start gap-4">
            <MessageCircle className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: "var(--axis-orange)" }} />
            <div>
              <h3 className="font-bold mb-2" style={{ color: "var(--axis-white)" }}>{t.help}</h3>
              <p className="mb-4" style={{ color: "var(--axis-gray)" }}>{t.helpDesc}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="https://t.me/avto_korea_nikolai" target="_blank" rel="noopener noreferrer"
                  className="inline-block font-bold py-2 px-6 rounded-lg text-white text-center transition-colors"
                  style={{ backgroundColor: "var(--axis-orange)" }}>
                  {t.telegram}
                </a>
                <a href="https://www.instagram.com/kmotors.shop/" target="_blank" rel="noopener noreferrer"
                  className="inline-block font-bold py-2 px-6 rounded-lg text-center transition-colors"
                  style={{ border: "1px solid var(--axis-orange)", color: "var(--axis-orange)" }}>
                  {t.instagram}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t" style={{ borderColor: "rgba(74,74,74,0.3)" }}>
          <p className="text-center mb-6" style={{ color: "var(--axis-gray)" }}>{t.popular}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { href: `/${lang}/catalog`, label: t.catalog },
              { href: `/${lang}/buy`, label: t.howToBuy },
              { href: `/${lang}/`, label: t.about },
              { href: `/${lang}/contact`, label: t.contacts },
            ].map(({ href, label }) => (
              <Link key={href} href={href}
                className="px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                style={{ border: "1px solid rgba(74,74,74,0.3)", color: "var(--axis-gray)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--axis-orange)"; (e.currentTarget as HTMLElement).style.color = "var(--axis-orange)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(74,74,74,0.3)"; (e.currentTarget as HTMLElement).style.color = "var(--axis-gray)"; }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
