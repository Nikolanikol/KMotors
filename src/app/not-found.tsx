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
    home: "На главную", homeDesc: "Вернитесь на главную страницу KMotors",
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
    home: "Go Home", homeDesc: "Return to KMotors homepage",
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
    home: "홈으로", homeDesc: "KMotors 홈페이지로 돌아가기",
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
    home: "მთავარზე", homeDesc: "KMotors მთავარ გვერდზე დაბრუნება",
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
    home: "الرئيسية", homeDesc: "العودة إلى الصفحة الرئيسية لـ KMotors",
    catalog: "الكتالوج", catalogDesc: "تصفح سياراتنا الكورية",
    help: "هل حدث خطأ ما؟",
    helpDesc: "إذا كنت تعتقد أن هذه الصفحة يجب أن تكون موجودة، تواصل مع فريقنا",
    telegram: "الكتابة على Telegram", instagram: "الكتابة على Instagram",
    popular: "الأقسام الشائعة:", howToBuy: "كيفية الشراء", about: "عن الشركة", contacts: "اتصل بنا",
  },
};

export default function NotFound() {
  const pathname = usePathname();
  const segments = pathname?.split("/") ?? [];
  const lang = SUPPORTED_LANGS.includes(segments[1]) ? segments[1] : "ru";
  const t = T[lang] || T.ru;
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4 py-12" dir={dir}>
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-orange-100 rounded-full mb-8">
            <AlertCircle className="w-12 h-12 text-orange-600" />
          </div>
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{t.title}</h2>
          <p className="text-lg text-gray-600 mb-2">{t.subtitle}</p>
          <p className="text-gray-500">{t.hint}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <Link href={`/${lang}/`}>
            <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-orange-500">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Home className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 mb-2">{t.home}</h3>
                  <p className="text-sm text-gray-600">{t.homeDesc}</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href={`/${lang}/catalog`}>
            <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-orange-500">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Search className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 mb-2">{t.catalog}</h3>
                  <p className="text-sm text-gray-600">{t.catalogDesc}</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-8 border-2 border-orange-200">
          <div className="flex items-start gap-4">
            <MessageCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-gray-900 mb-2">{t.help}</h3>
              <p className="text-gray-700 mb-4">{t.helpDesc}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="https://t.me/kmotorsshop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-orange-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-700 transition-colors text-center"
                >
                  {t.telegram}
                </a>
                <a
                  href="https://www.instagram.com/kmotors.shop/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-white text-orange-600 font-bold py-2 px-6 rounded-lg border-2 border-orange-600 hover:bg-orange-50 transition-colors text-center"
                >
                  {t.instagram}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t-2 border-gray-200">
          <p className="text-gray-600 text-center mb-6">{t.popular}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={`/${lang}/catalog`} className="px-4 py-2 bg-white border-2 border-orange-500 text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-colors">
              {t.catalog}
            </Link>
            <Link href={`/${lang}/buy`} className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-orange-500 hover:text-orange-600 transition-colors">
              {t.howToBuy}
            </Link>
            <Link href={`/${lang}/`} className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-orange-500 hover:text-orange-600 transition-colors">
              {t.about}
            </Link>
            <Link href={`/${lang}/contact`} className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-orange-500 hover:text-orange-600 transition-colors">
              {t.contacts}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
