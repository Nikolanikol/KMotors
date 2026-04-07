import type { Metadata } from "next";
import BuyClientPage from "@/app/buy/BuyClientPage";

const BUY_META: Record<string, { title: string; description: string }> = {
  ru: {
    title: "Как купить авто из Кореи — пошаговая инструкция | KMotors",
    description: "Пошаговая инструкция по покупке автомобиля из Южной Кореи через KMotors. Выбор, документы, оплата, доставка, таможня.",
  },
  en: {
    title: "How to Buy a Car from Korea — Step by Step | KMotors",
    description: "Step-by-step guide to buying a car from South Korea through KMotors. Selection, documents, payment, delivery, customs.",
  },
  ko: {
    title: "한국에서 자동차 구매 방법 — 단계별 가이드 | KMotors",
    description: "KMotors를 통해 한국에서 자동차를 구매하는 단계별 가이드. 선택, 서류, 결제, 배송, 세관.",
  },
  ka: {
    title: "კორეიდან ავტომობილის შეძენა — ნაბიჯ-ნაბიჯ | KMotors",
    description: "KMotors-ის მეშვეობით კორეიდან ავტომობილის შეძენის სრული ინსტრუქცია. შერჩევა, დოკუმენტები, გადახდა, მიტანა.",
  },
  ar: {
    title: "كيفية شراء سيارة من كوريا — خطوة بخطوة | KMotors",
    description: "دليل خطوة بخطوة لشراء سيارة من كوريا الجنوبية عبر KMotors. الاختيار والوثائق والدفع والتوصيل والجمارك.",
  },
};

const FAQ_BY_LANG: Record<string, { q: string; a: string }[]> = {
  ru: [
    { q: "Как купить автомобиль из Кореи?", a: "Процесс: выбор авто, задаток 2 000 000 вон, проверка специалистом, оплата остатка, таможня, доставка морем, получение." },
    { q: "Сколько стоит доставка?", a: "Зависит от модели и пункта назначения. Доставка до Владивостока 7–14 дней. Свяжитесь с нами для расчёта." },
    { q: "Можно ли проверить авто перед покупкой?", a: "Да. После задатка специалист осматривает авто в Корее и отправляет фото/видео отчёт." },
  ],
  en: [
    { q: "How to buy a car from Korea?", a: "Process: choose a car, deposit 2,000,000 KRW, specialist inspection, pay balance, customs, sea delivery, receive." },
    { q: "How much does delivery cost?", a: "Depends on the model and destination. Delivery to Vladivostok takes 7–14 days. Contact us for a quote." },
    { q: "Can I inspect the car before buying?", a: "Yes. After the deposit, our specialist inspects the car in Korea and sends a photo/video report." },
  ],
  ko: [
    { q: "한국에서 자동차를 구매하는 방법?", a: "과정: 차량 선택, 보증금 200만원, 전문가 검사, 잔금 납부, 세관, 해상 운송, 수령." },
    { q: "배송 비용은?", a: "모델과 목적지에 따라 다릅니다. 블라디보스토크까지 7-14일. 견적을 위해 연락해 주세요." },
    { q: "구매 전 차량 검사 가능?", a: "네. 보증금 납부 후 전문가가 한국에서 차량을 검사하고 사진/동영상 보고서를 보내드립니다." },
  ],
  ka: [
    { q: "კორეიდან ავტომობილის შეძენა?", a: "პროცესი: ავტომობილის შერჩევა, მოწინავე 2 000 000 ვონი, სპეციალისტის შემოწმება, ნაშთის გადახდა, საბაჟო, მიტანა." },
    { q: "მიტანა ღირს რამდენი?", a: "დამოკიდებულია მოდელსა და დანიშნულებაზე. გაგვიკავშირდით ზუსტი ფასისთვის." },
    { q: "შეიძლება ყიდვამდე შემოწმება?", a: "დიახ. სპეციალისტი ამოწმებს ავტომობილს კორეაში და გიგზავნით ფოტო/ვიდეო ანგარიშს." },
  ],
  ar: [
    { q: "كيفية شراء سيارة من كوريا؟", a: "العملية: اختيار السيارة، دفع عربون 2,000,000 وون، فحص المتخصص، دفع الرصيد، الجمارك، الشحن البحري، الاستلام." },
    { q: "كم تكلفة التوصيل؟", a: "تعتمد على الموديل والوجهة. للحصول على عرض سعر، تواصل معنا." },
    { q: "هل يمكنني فحص السيارة قبل الشراء؟", a: "نعم. بعد العربون، يفحص متخصصنا السيارة في كوريا ويرسل تقريرًا بالصور والفيديو." },
  ],
};

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const meta = BUY_META[lang] || BUY_META.ru;

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://kmotors.shop/${lang}/buy`,
      images: [{ url: "https://kmotors.shop/preview/preview.png" }],
    },
    alternates: {
      canonical: `https://kmotors.shop/${lang}/buy`,
      languages: {
        ru: "https://kmotors.shop/ru/buy",
        en: "https://kmotors.shop/en/buy",
        ko: "https://kmotors.shop/ko/buy",
        ka: "https://kmotors.shop/ka/buy",
        ar: "https://kmotors.shop/ar/buy",
        "x-default": "https://kmotors.shop/ru/buy",
      },
    },
  };
}

export default async function BuyPage({ params }: Props) {
  const { lang } = await params;
  const faqs = FAQ_BY_LANG[lang] || FAQ_BY_LANG.ru;

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <BuyClientPage />
    </>
  );
}
