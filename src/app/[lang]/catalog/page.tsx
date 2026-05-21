import Filter from "@/components/Catalog/Filter/Filter";
import CarsRow from "@/components/Catalog/Row/CarsRow";
import { getString } from "@/components/Catalog/Row/utils";
import { getCars } from "@/components/Catalog/Row/utils/service";
import { CarSearchParams } from "@/components/Catalog/Row/utils/Types";
import { Metadata } from "next";
import { Suspense } from "react";

export const revalidate = 300;

const CATALOG_META: Record<string, { default: string; withBrand: string; description: string }> = {
  ru: {
    default: "Каталог авто из Кореи — Hyundai, Kia, Genesis | KMotors",
    withBrand: "Купить {brand} из Кореи — каталог авто | KMotors",
    description: "Каталог корейских автомобилей из Южной Кореи: Hyundai, Kia, Genesis. Актуальные цены, фото, характеристики. Доставка в Россию, Казахстан, Узбекистан, Грузию.",
  },
  en: {
    default: "Korean Cars Catalog — Hyundai, Kia, Genesis | KMotors",
    withBrand: "Buy {brand} from Korea — car catalog | KMotors",
    description: "Catalog of Korean cars from South Korea: Hyundai, Kia, Genesis. Current prices, photos, specs. Delivery to Russia, Kazakhstan, Uzbekistan, Georgia.",
  },
  ko: {
    default: "한국 자동차 카탈로그 — Hyundai, Kia, Genesis | KMotors",
    withBrand: "한국에서 {brand} 구매 — 자동차 카탈로그 | KMotors",
    description: "한국 자동차 카탈로그: Hyundai, Kia, Genesis. 최신 가격, 사진, 사양. 러시아, 카자흐스탄, 우즈베키스탄, 조지아 배송.",
  },
  ka: {
    default: "კორეული ავტომობილების კატალოგი — Hyundai, Kia, Genesis | KMotors",
    withBrand: "შეიძინეთ {brand} კორეიდან — კატალოგი | KMotors",
    description: "კორეული ავტომობილების კატალოგი: Hyundai, Kia, Genesis. აქტუალური ფასები, ფოტოები, მახასიათებლები. მიტანა საქართველოში.",
  },
  ar: {
    default: "كتالوج السيارات الكورية — Hyundai وKia وGenesis | KMotors",
    withBrand: "اشتر {brand} من كوريا — كتالوج السيارات | KMotors",
    description: "كتالوج السيارات الكورية من كوريا الجنوبية: Hyundai وKia وGenesis. أسعار حالية، صور، مواصفات. التوصيل إلى روسيا وكازاخستان وأوزبكستان.",
  },
};

interface Props {
  params: Promise<{ lang: string }>;
  searchParams: CarSearchParams;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang } = await params;
  const sp = await searchParams;
  const meta = CATALOG_META[lang] || CATALOG_META.ru;

  const manufacture = sp.manufacture?.slice(1) || "";
  const yearMin = sp.yearMin || "";
  const yearMax = sp.yearMax || "";
  const priceMax = sp.priceMax || "";

  let title = meta.default;
  if (manufacture) title = meta.withBrand.replace("{brand}", manufacture);

  const descParts: string[] = [];
  if (manufacture) descParts.push(manufacture);
  if (yearMin && yearMax) descParts.push(`${yearMin}–${yearMax}`);
  if (priceMax) descParts.push(`≤${Number(priceMax).toLocaleString()} KRW`);

  const description = descParts.length > 0
    ? `${meta.description} ${descParts.join(", ")}.`
    : meta.description;

  const canonical = manufacture
    ? `https://kmotors.shop/${lang}/catalog?manufacture=.${manufacture}`
    : `https://kmotors.shop/${lang}/catalog`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonical,
      images: [{ url: "https://kmotors.shop/preview/preview.png" }],
    },
    alternates: {
      canonical,
      languages: {
        ru: "https://kmotors.shop/ru/catalog",
        en: "https://kmotors.shop/en/catalog",
        ko: "https://kmotors.shop/ko/catalog",
        ka: "https://kmotors.shop/ka/catalog",
        ar: "https://kmotors.shop/ar/catalog",
        "x-default": "https://kmotors.shop/ru/catalog",
      },
    },
  };
}

const CATALOG_LABEL: Record<string, string> = {
  ru: "Каталог", en: "Catalog", ko: "카탈로그", ka: "კატალოგი", ar: "الكتالوج",
};

const CATALOG_FAQ: Record<string, { q: string; a: string }[]> = {
  ru: [
    { q: "Сколько стоит доставка авто из Кореи?", a: "Стоимость доставки зависит от модели и пункта назначения. До Владивостока — 7–14 дней морем. Свяжитесь с менеджером для точного расчёта." },
    { q: "Сколько стоит растаможить авто из Кореи?", a: "Таможенные пошлины зависят от объёма двигателя, года выпуска и стоимости автомобиля. Наши менеджеры помогут рассчитать итоговую стоимость с учётом всех расходов." },
    { q: "Можно ли проверить автомобиль перед покупкой?", a: "Да. После внесения задатка наш специалист в Корее осматривает автомобиль и отправляет подробный фото- и видеоотчёт." },
    { q: "Какие марки автомобилей можно купить?", a: "В каталоге более 10 000 автомобилей: Hyundai, Kia, Genesis, Samsung, SsangYong. Все автомобили с корейского рынка, прошедшие проверку." },
  ],
  en: [
    { q: "How much does car delivery from Korea cost?", a: "Delivery cost depends on the model and destination. To Vladivostok — 7–14 days by sea. Contact a manager for an exact quote." },
    { q: "How much are customs duties for a car from Korea?", a: "Customs duties depend on engine displacement, year of manufacture, and vehicle value. Our managers will help calculate the total cost including all expenses." },
    { q: "Can I inspect the car before buying?", a: "Yes. After the deposit, our specialist in Korea inspects the car and sends a detailed photo and video report." },
    { q: "Which car brands are available?", a: "The catalog has over 10,000 cars: Hyundai, Kia, Genesis, Samsung, SsangYong. All vehicles are from the Korean market and have been verified." },
  ],
  ko: [
    { q: "한국에서 자동차 배송 비용은?", a: "배송 비용은 모델과 목적지에 따라 다릅니다. 블라디보스토크까지 해상 운송으로 7-14일. 정확한 견적은 담당자에게 문의하세요." },
    { q: "한국산 자동차 관세는 얼마인가요?", a: "관세는 배기량, 연식, 차량 가격에 따라 다릅니다. 담당자가 모든 비용을 포함한 총 비용 계산을 도와드립니다." },
    { q: "구매 전 차량 점검이 가능한가요?", a: "네. 보증금 납부 후 한국 현지 전문가가 차량을 점검하고 상세한 사진·영상 보고서를 보내드립니다." },
    { q: "어떤 브랜드를 구매할 수 있나요?", a: "카탈로그에 10,000대 이상의 차량이 있습니다: Hyundai, Kia, Genesis, Samsung, SsangYong. 모두 검증된 한국 시장 차량입니다." },
  ],
  ka: [
    { q: "კორეიდან ავტომობილის მიტანა რამდენი ღირს?", a: "მიტანის ღირებულება დამოკიდებულია მოდელსა და დანიშნულებაზე. ვლადივოსტოკამდე — 7-14 დღე საზღვაო გზით. ზუსტი ფასისთვის დაგვიკავშირდით." },
    { q: "კორეიდან ავტომობილის გაბაჟება რამდენი ღირს?", a: "საბაჟო გადასახადი დამოკიდებულია ძრავის მოცულობაზე, გამოშვების წელსა და ავტომობილის ღირებულებაზე. ჩვენი მენეჯერები დაგეხმარებიან ყველა ხარჯის გათვალისწინებით." },
    { q: "შეიძლება ყიდვამდე ავტომობილის შემოწმება?", a: "დიახ. მოწინავე გადახდის შემდეგ კორეაში მყოფი სპეციალისტი ამოწმებს ავტომობილს და აგზავნის დეტალურ ფოტო და ვიდეო ანგარიშს." },
    { q: "რომელი მარკების ავტომობილები არის ხელმისაწვდომი?", a: "კატალოგში 10 000-ზე მეტი ავტომობილია: Hyundai, Kia, Genesis, Samsung, SsangYong. ყველა კორეული ბაზრის შემოწმებული ავტომობილი." },
  ],
  ar: [
    { q: "كم تكلفة شحن السيارة من كوريا؟", a: "تعتمد تكلفة الشحن على الموديل والوجهة. إلى فلاديفوستوك — 7-14 يومًا عبر البحر. تواصل مع المدير للحصول على عرض سعر دقيق." },
    { q: "كم تبلغ رسوم الجمارك لسيارة من كوريا؟", a: "تعتمد الرسوم الجمركية على حجم المحرك وسنة الصنع وقيمة السيارة. سيساعدك مديرونا في حساب التكلفة الإجمالية شاملةً جميع النفقات." },
    { q: "هل يمكن فحص السيارة قبل الشراء؟", a: "نعم. بعد دفع العربون، يفحص متخصصنا في كوريا السيارة ويرسل تقريرًا مفصلًا بالصور والفيديو." },
    { q: "ما هي العلامات التجارية المتوفرة؟", a: "يضم الكتالوج أكثر من 10,000 سيارة: Hyundai وKia وGenesis وSamsung وSsangYong. جميعها من السوق الكورية وتم التحقق منها." },
  ],
};

export default async function CatalogPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const sp = await searchParams;

  const faqs = CATALOG_FAQ[lang] || CATALOG_FAQ.ru;
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "KMotors", item: `https://kmotors.shop/${lang}/` },
      { "@type": "ListItem", position: 2, name: CATALOG_LABEL[lang] || "Catalog", item: `https://kmotors.shop/${lang}/catalog` },
    ],
  };

  // ItemList schema — fetch deduplicated by Next.js cache (same call as CarsRow)
  let itemListSchema = null;
  try {
    const query = getString(sp);
    const { data } = await getCars(query, sp.page);
    if (data && data.length > 0) {
      itemListSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: CATALOG_LABEL[lang] || "Catalog",
        url: `https://kmotors.shop/${lang}/catalog`,
        numberOfItems: data.length,
        itemListElement: data.map((car: { Id: string; Manufacturer?: string; Model?: string; Year?: string; Price?: string }, index: number) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `https://kmotors.shop/${lang}/catalog/${car.Id}`,
          name: [car.Manufacturer, car.Model, car.Year].filter(Boolean).join(" "),
        })),
      };
    }
  } catch {
    // schema is optional — don't break page if fetch fails
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="min-h-screen pt-8" style={{ backgroundColor: "var(--axis-black)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="col-span-1 lg:col-span-3">
              <Suspense fallback={
                <div className="animate-pulse rounded-2xl h-96" style={{ backgroundColor: "var(--axis-charcoal)" }} />
              }>
                <Filter />
              </Suspense>
            </div>
            <div className="col-span-1 lg:col-span-9">
              <CarsRow searchParams={searchParams} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
