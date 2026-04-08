import type { Metadata } from "next";
import ContactClientPage from "@/app/contact/ContactClientPage";

const CONTACT_META: Record<string, { title: string; description: string }> = {
  ru: {
    title: "Контакты KMotors — заказать авто из Кореи",
    description: "Свяжитесь с KMotors для заказа автомобиля из Южной Кореи. Telegram, WhatsApp, телефон. Доставка в Россию, Казахстан, Узбекистан, Грузию.",
  },
  en: {
    title: "Contact KMotors — Order a Car from Korea",
    description: "Contact KMotors to order a car from South Korea. Telegram, WhatsApp, phone. Delivery to Russia, Kazakhstan, Uzbekistan, Georgia.",
  },
  ko: {
    title: "KMotors 연락처 — 한국 자동차 주문",
    description: "한국에서 자동차를 주문하려면 KMotors에 문의하세요. 텔레그램, WhatsApp, 전화. 러시아, 카자흐스탄, 우즈베키스탄, 조지아 배송.",
  },
  ka: {
    title: "KMotors კონტაქტი — კორეიდან ავტომობილის შეკვეთა",
    description: "დაუკავშირდით KMotors-ს კორეიდან ავტომობილის შესაკვეთად. Telegram, WhatsApp, ტელეფონი. მიტანა საქართველოში.",
  },
  ar: {
    title: "تواصل مع KMotors — اطلب سيارة من كوريا",
    description: "تواصل مع KMotors لطلب سيارة من كوريا الجنوبية. تيليغرام، واتساب، هاتف. التوصيل إلى روسيا وكازاخستان وأوزبكستان وجورجيا.",
  },
};

const FAQ_BY_LANG: Record<string, { q: string; a: string }[]> = {
  ru: [
    { q: "Как связаться с KMotors?", a: "Вы можете связаться с нами через Telegram, WhatsApp или по телефону. Заполните форму на сайте — менеджер ответит в ближайшее время." },
    { q: "Как быстро вы отвечаете на заявки?", a: "Мы стараемся отвечать в течение нескольких часов. В рабочее время ответ приходит, как правило, в течение 30 минут." },
    { q: "Можно ли заказать подбор автомобиля под мои требования?", a: "Да. Напишите нам желаемую марку, модель, год выпуска и бюджет — наш специалист подберёт подходящие варианты из Южной Кореи." },
  ],
  en: [
    { q: "How to contact KMotors?", a: "You can reach us via Telegram, WhatsApp, or phone. Fill out the form on the website — a manager will respond shortly." },
    { q: "How quickly do you respond to inquiries?", a: "We aim to respond within a few hours. During business hours, replies typically arrive within 30 minutes." },
    { q: "Can I order a car search tailored to my requirements?", a: "Yes. Tell us the desired make, model, year, and budget — our specialist will find the best options from South Korea." },
  ],
  ko: [
    { q: "KMotors에 연락하는 방법?", a: "텔레그램, WhatsApp 또는 전화로 연락하실 수 있습니다. 웹사이트 양식을 작성하시면 담당자가 빠르게 답변드립니다." },
    { q: "문의에 얼마나 빨리 답변하나요?", a: "몇 시간 내에 답변 드립니다. 업무 시간 중에는 일반적으로 30분 이내에 답변합니다." },
    { q: "맞춤 차량 검색을 요청할 수 있나요?", a: "네. 원하는 제조사, 모델, 연도, 예산을 알려주시면 전문가가 한국에서 최적의 옵션을 찾아드립니다." },
  ],
  ka: [
    { q: "როგორ დავუკავშირდე KMotors-ს?", a: "შეგიძლიათ დაგვიკავშირდეთ Telegram-ით, WhatsApp-ით ან ტელეფონით. შეავსეთ ფორმა — მენეჯერი მალე გიპასუხებთ." },
    { q: "რამდენ ხანში პასუხობთ?", a: "ვცდილობთ რამდენიმე საათში ვუპასუხოთ. სამუშაო საათებში ჩვეულებრივ 30 წუთში ვპასუხობთ." },
    { q: "შეიძლება ჩემი მოთხოვნებით ავტომობილის შერჩევა?", a: "დიახ. გვითხარით სასურველი მარკა, მოდელი, წელი და ბიუჯეტი — სპეციალისტი კორეიდან საუკეთესო ვარიანტებს შეარჩევს." },
  ],
  ar: [
    { q: "كيف أتواصل مع KMotors؟", a: "يمكنك التواصل معنا عبر تيليغرام أو واتساب أو الهاتف. املأ النموذج على الموقع وسيرد عليك مدير قريبًا." },
    { q: "كم تستغرق الاستجابة للاستفسارات؟", a: "نحاول الرد في غضون ساعات قليلة. خلال ساعات العمل، يأتي الرد عادةً خلال 30 دقيقة." },
    { q: "هل يمكنني طلب البحث عن سيارة وفق متطلباتي؟", a: "نعم. أخبرنا بالماركة والموديل والسنة والميزانية المطلوبة وسيجد متخصصنا أفضل الخيارات من كوريا الجنوبية." },
  ],
};

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const meta = CONTACT_META[lang] || CONTACT_META.ru;

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://kmotors.shop/${lang}/contact`,
      images: [{ url: "https://kmotors.shop/preview/preview.png" }],
    },
    alternates: {
      canonical: `https://kmotors.shop/${lang}/contact`,
      languages: {
        ru: "https://kmotors.shop/ru/contact",
        en: "https://kmotors.shop/en/contact",
        ko: "https://kmotors.shop/ko/contact",
        ka: "https://kmotors.shop/ka/contact",
        ar: "https://kmotors.shop/ar/contact",
        "x-default": "https://kmotors.shop/ru/contact",
      },
    },
  };
}

const CONTACT_LABEL: Record<string, string> = {
  ru: "Контакты", en: "Contact", ko: "연락처", ka: "კონტაქტი", ar: "اتصل بنا",
};

export default async function ContactPage({ params }: Props) {
  const { lang } = await params;
  const faqs = FAQ_BY_LANG[lang] || FAQ_BY_LANG.ru;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "KMotors", item: `https://kmotors.shop/${lang}/` },
      { "@type": "ListItem", position: 2, name: CONTACT_LABEL[lang] || "Contact", item: `https://kmotors.shop/${lang}/contact` },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <ContactClientPage />
    </>
  );
}
