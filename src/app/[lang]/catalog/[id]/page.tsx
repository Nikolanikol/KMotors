import { notFound } from "next/navigation";
import { headers } from "next/headers";
import dynamic from "next/dynamic";
import { MODEL_PAGES } from "@/data/model-pages";
import CarouselLight from "@/components/Catalog/CarDetail/Carousel/Carousel";
import VinMileageSection from "@/components/Catalog/CarDetail/VinRow";
import RecommendedCars from "@/components/Catalog/CarDetail/Recommended/RecommendedCars";
import { FC, Suspense } from "react";
import { DetailInfoSkeleton } from "@/components/Catalog/CarDetail/DetailInfoSection";
import { formatDate, formatYear } from "@/utils/formatDate";
import { Metadata } from "next";
import { getCurrencyRates } from "@/utils/getCurrencyRates";
import { translateGenerationRow } from "@/utils/translateGenerationRow";
import { makeAlternates } from "@/lib/seo";
import { fetchVehicleData as fetchData, VehicleUpstreamError } from "@/lib/vehicle";
import { fetchVehicleRecord } from "@/lib/vehicleRecord";
import { buildSpecBits, loadCarsDict, normalizeBrand } from "@/lib/carLabels";

// Lazy load — не нужны сразу при загрузке
const DetailInfoSection = dynamic(
  () => import("@/components/Catalog/CarDetail/DetailInfoSection"),
);
const OptionsRow = dynamic(
  () => import("@/components/Catalog/CarDetail/OptionsRow/OptionsRow"),
);
const CustomsCalculator = dynamic(
  () =>
    import("@/components/Catalog/CarDetail/CustomsCalculator/CustomsCalculator"),
);
const CarDetailSidebar = dynamic(
  () => import("@/components/Catalog/CarDetail/CarDetailSidebar"),
);
const CarDescription = dynamic(
  () => import("@/components/Catalog/CarDetail/CarDescription"),
);
const StickyMobileCTA = dynamic(
  () => import("@/components/Catalog/CarDetail/StickyMobileCTA"),
);
const CarViewTracker = dynamic(
  () => import("@/components/Catalog/CarDetail/CarViewTracker"),
);

interface PageProps {
  params: Promise<{ lang: string; id: string }>;
}

// Separate fast fetch for metadata — strict 1.5s timeout so WhatsApp never waits too long
async function fetchDataFast(id: string) {
  try {
    const res = await fetch(`https://api.encar.com/v1/readside/vehicle/${id}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Мессенджеры/соцсети обрывают превью по таймауту — только им отдаём быстрый
// generic-фоллбек. Googlebot должен получить полные метаданные, иначе тысячи
// страниц с одинаковым title склеиваются в GSC как «копии без canonical».
const SOCIAL_BOT_RE =
  /whatsapp|telegram|facebookexternalhit|facebot|twitterbot|slack|linkedin|discord|viber|skype|vkshare|pinterest/i;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { lang, id } = await params;
  const ua = (await headers()).get("user-agent") ?? "";
  const isSocialBot = SOCIAL_BOT_RE.test(ua);

  // Соц-краулер — быстрый фетч с жёстким таймаутом; все остальные (включая
  // Googlebot) ждут полные данные. fetchData кэшируется, поэтому страница
  // ниже переиспользует тот же ответ без второго запроса.
  //
  // «Продана» и «апстрим лёг» — РАЗНЫЕ случаи, и раньше они схлопывались в один
  // catch(() => null): во время аварии Encar каждая живая карточка отдавалась с
  // HTTP 200 и noindex, то есть мы сами просили Google выкинуть их из индекса.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any = null;
  let upstreamDown = false;
  if (isSocialBot) {
    data = await fetchDataFast(id);
  } else {
    try {
      data = await fetchData(id);
    } catch (e) {
      upstreamDown = e instanceof VehicleUpstreamError;
      data = null;
    }
  }

  // Нет данных = машина продана/удалена (Encar 404) → это не индексируемая
  // страница. Соц-краулеры (WhatsApp) получают generic-превью по таймауту — им
  // robots не важен. Googlebot же ДОЛЖЕН получить noindex, иначе сотни таких
  // страниц с одинаковым title «Авто из Кореи» склеиваются в GSC как
  // «Дубликат, канонический не выбран» (см. page также вызывает notFound()).
  // Исключение — авария апстрима: robots не выставляем вообще. Страница живая,
  // данные вернутся, а noindex за время аварии стоит переобхода и позиций.
  if (!data)
    return {
      title: `Авто из Кореи`,
      description:
        "Купить автомобиль из Южной Кореи. Доставка 3–6 недель. K-Axis.",
      ...(upstreamDown ? {} : { robots: { index: false, follow: true } }),
      openGraph: {
        title: "Авто из Кореи",
        description: "Купить автомобиль из Южной Кореи.",
        type: "website",
      },
      alternates: makeAlternates(lang, `/catalog/${id}`),
    };

  const carName = [
    normalizeBrand(data.category.manufacturerEnglishName),
    data.category.modelGroupEnglishName,
    data.category.gradeDetailEnglishName,
    data.category.gradeEnglishName,
  ]
    .filter(Boolean)
    .join(" ");

  const year = formatYear(data?.category?.yearMonth);
  // пробег теперь приходит из buildSpecBits — с локализованной единицей
  const krwPrice = data?.advertisement?.price
    ? data.advertisement.price * 10000
    : null;

  // Цена в сниппете обязана совпадать с той, что человек увидит на странице,
  // иначе клик заканчивается разочарованием. Повторяем логику CarDetailSidebar:
  // ru → ₽, остальные → $, курс живой (раньше здесь был зашит 0.065 — он
  // завышал рублёвую цену примерно на 12% относительно фактического курса).
  // Соц-краулерам курс не ждём: у них жёсткий таймаут на превью.
  const rates = isSocialBot ? null : await getCurrencyRates();
  const priceLabel = (() => {
    if (!krwPrice || !rates) return null;
    if (lang === "ru" && rates.krwToRub)
      return `${Math.round(krwPrice * rates.krwToRub).toLocaleString("ru-RU")} ₽`;
    if (rates.krwToUsd)
      return `$${Math.round(krwPrice * rates.krwToUsd).toLocaleString("en-US")}`;
    return null;
  })();

  // Обрезаем carName если слишком длинный (лимит title ~60 символов;
  // запас урезан, т.к. в заголовок теперь идёт ещё и цена)
  const shortCarName =
    carName.length > 34 ? carName.slice(0, 32) + "…" : carName;

  // Порядок: модель → год → «из Кореи» → цена. Первые два блока отвечают
  // запросу, гео-хвост — ключевая фраза, цена закрывает интент «сколько стоит»
  // (для ka это буквально топовый запрос: «ფასი» = «цена»).
  const TITLE: Record<string, string> = {
    ru: `${shortCarName} ${year} из Кореи${priceLabel ? ` — цена ${priceLabel}` : ""}`,
    en: `${shortCarName} ${year} from Korea${priceLabel ? ` — price ${priceLabel}` : ""}`,
    ko: `한국산 ${shortCarName} ${year}${priceLabel ? ` — ${priceLabel}` : ""}`,
    // ka — цена ПЕРЕД гео: грузинские глифы шире латиницы, Google режет title
    // по ширине в пикселях, а гео-слова в целевом запросе («kia ev6 gt line
    // ფასი») нет — обрезаться должен хвост «კორეიდან», а не цена
    ka: priceLabel
      ? `${shortCarName} ${year} — ფასი ${priceLabel}, კორეიდან`
      : `${shortCarName} ${year} კორეიდან`,
    ar: `${shortCarName} ${year} من كوريا${priceLabel ? ` — السعر ${priceLabel}` : ""}`,
  };

  // Хвост описания: кузов, топливо, КПП, пробег + история (ДТП/владельцы).
  // Это то, чем две одинаковые по модели и году карточки реально отличаются
  // друг от друга — без него сниппеты серии «Grandeur 2017» выглядели клонами.
  // История приходит отдельным запросом (кэш 1 ч, дедуплицируется с блоком на
  // странице). Соц-краулерам не ждём: у них жёсткий бюджет на превью.
  const record = isSocialBot ? null : await fetchVehicleRecord(data?.vehicleId, data?.vehicleNo);
  const dict = await loadCarsDict(lang);
  const { specs, history } = buildSpecBits({
    lang,
    dict,
    bodyRaw: record?.carShape,
    fuelRaw: data?.spec?.fuelName,
    transmissionRaw: data?.spec?.transmissionName ?? record?.transmission,
    mileage: data?.spec?.mileage,
    accidents:
      record && (record.myAccidentCnt != null || record.otherAccidentCnt != null)
        ? (record.myAccidentCnt ?? 0) + (record.otherAccidentCnt ?? 0)
        : null,
    owners: record?.ownerChangeCnt,
  });

  const LEAD: Record<string, string> = {
    ru: `Купить ${carName} ${year} из Кореи${priceLabel ? ` — ${priceLabel}` : ""}`,
    en: `Buy ${carName} ${year} from South Korea${priceLabel ? ` — ${priceLabel}` : ""}`,
    ko: `${carName} ${year} 한국에서 구매${priceLabel ? ` — ${priceLabel}` : ""}`,
    ka: `${carName} ${year} კორეიდან შეძენა${priceLabel ? ` — ფასი ${priceLabel}` : ""}`,
    ar: `شراء ${carName} ${year} من كوريا الجنوبية${priceLabel ? ` — ${priceLabel}` : ""}`,
  };
  const TAIL: Record<string, string> = {
    ru: "Осмотр в Корее, доставка 3–6 недель.",
    en: "Inspection in Korea, delivery in 3–6 weeks.",
    ko: "한국 현지 검사, 3–6주 배송.",
    ka: "დათვალიერება კორეაში, მიტანა 3–6 კვირა.",
    ar: "فحص في كوريا، التوصيل 3–6 أسابيع.",
  };

  // Google показывает ~160 символов. Собираем от важного к второстепенному и
  // отбрасываем хвост, который всё равно не поместится.
  const buildDescription = (l: string) => {
    const parts = [
      `${LEAD[l] ?? LEAD.ru}.`,
      specs.length ? `${specs.join(", ")}.` : "",
      history.length ? `${history.join(", ")}.` : "",
      TAIL[l] ?? TAIL.ru,
    ].filter(Boolean);

    let out = "";
    for (const part of parts) {
      if (out && `${out} ${part}`.length > 165) break;
      out = out ? `${out} ${part}` : part;
    }
    return out;
  };

  const DESCRIPTION: Record<string, string> = {
    ru: buildDescription("ru"),
    en: buildDescription("en"),
    ko: buildDescription("ko"),
    ka: buildDescription("ka"),
    ar: buildDescription("ar"),
  };

  const title = TITLE[lang] ?? TITLE.ru;
  const description = DESCRIPTION[lang] ?? DESCRIPTION.ru;

  // Sort photos same way as Carousel (OUTER first) and get direct encar URL
  // WhatsApp fetches this directly — no latency from our server
  const TYPE_ORDER: Record<string, number> = { OUTER: 0, OPTION: 1, INNER: 2 };
  const sortedPhotos = [...(data?.photos || [])].sort((a: any, b: any) => {
    const typeA = TYPE_ORDER[a.type] ?? 1;
    const typeB = TYPE_ORDER[b.type] ?? 1;
    if (typeA !== typeB) return typeA - typeB;
    return (a.code || "").localeCompare(b.code || "", undefined, {
      numeric: true,
    });
  });
  const ogImage = sortedPhotos[0]?.path
    ? `https://ci.encar.com${sortedPhotos[0].path}?impolicy=heightRate&rh=630&cw=1200&ch=630&cg=Center`
    : undefined;

  return {
    // absolute — гасим глобальный шаблон «%s | K-Axis»: суффикс съедает ~9
    // символов из лимита, а узнаваемости бренда пока не добавляет
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(ogImage && {
        images: [{ url: ogImage, width: 1200, height: 630, alt: carName }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: makeAlternates(lang, `/catalog/${id}`),
  };
}

const Page: FC<{ params: Promise<{ lang: string; id: string }> }> = async ({
  params,
}) => {
  const { lang, id } = await params;
  const data = await fetchData(id);
  if (
    !data ||
    !data.category?.manufacturerEnglishName ||
    !data.advertisement?.price
  )
    notFound();

  const carName = [
    normalizeBrand(data.category.manufacturerEnglishName),
    data.category.modelGroupEnglishName,
    data.category.gradeDetailEnglishName,
    data.category.gradeEnglishName,
  ].join(" ");
  const carData = formatDate(data?.category?.yearMonth);
  const rates = await getCurrencyRates();
  const mainPhoto = data?.photos?.[0]?.path
    ? `https://ci.encar.com${data.photos[0].path}`
    : null;

  const CATALOG_LABEL: Record<string, string> = {
    ru: "Каталог",
    en: "Catalog",
    ko: "카탈로그",
    ka: "კატალოგი",
    ar: "الكتالوج",
  };

  // H1 обязан перекликаться с title: Google берёт H1 как основной источник для
  // переписывания заголовка в выдаче. Раньше H1 был чисто английским на всех
  // языках — title обещал «კორეიდან», а заголовок страницы это не подтверждал.
  const FROM_KOREA_LABEL: Record<string, string> = {
    ru: "из Кореи",
    en: "from Korea",
    ko: "한국산",
    ka: "კორეიდან",
    ar: "من كوريا",
  };
  const fromKorea = FROM_KOREA_LABEL[lang] ?? FROM_KOREA_LABEL.ru;
  const carYear = formatYear(data?.category?.yearMonth);

  // Хвост H1: пробег и КПП. Обязательный префикс (модель + комплектация + год +
  // «из Кореи») остаётся слово в слово как в title — инвариант из CLAUDE.md не
  // нарушен, а заголовок перестаёт быть клоном соседних карточек той же модели.
  const h1Dict = await loadCarsDict(lang);
  const { mileageLabel: h1Mileage, transmission: h1Transmission } = buildSpecBits({
    lang,
    dict: h1Dict,
    mileage: data?.spec?.mileage,
    transmissionRaw: data?.spec?.transmissionName,
  });
  const h1Tail = [h1Mileage, h1Transmission].filter(Boolean).join(" · ");

  const BUY_PRICE_LABEL: Record<string, string> = {
    ru: "Цена покупки",
    en: "Purchase price",
    ko: "구매 가격",
    ka: "ყიდვის ფასი",
    ar: "سعر الشراء",
  };
  const WON_LABEL: Record<string, string> = {
    ru: "вон",
    en: "won",
    ko: "원",
    ka: "ვონი",
    ar: "وون",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "K-Axis",
        item: `https://www.kmotors.shop/${lang}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: CATALOG_LABEL[lang] || "Catalog",
        item: `https://www.kmotors.shop/${lang}/catalog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: carName,
        item: `https://www.kmotors.shop/${lang}/catalog/${id}`,
      },
    ],
  };

  // Map Korean fuel names → schema.org vocabulary
  const fuelMap: Record<string, string> = {
    가솔린: "https://schema.org/Gasoline",
    디젤: "https://schema.org/Diesel",
    전기: "https://schema.org/Electric",
    LPG: "https://schema.org/LPG",
    lpg: "https://schema.org/LPG",
    하이브리드: "https://schema.org/Hybrid",
    플러그인하이브리드: "https://schema.org/Hybrid",
    수소: "https://schema.org/Hydrogen",
  };
  const rawFuel: string = data?.spec?.fuelName ?? "";
  const schemaFuel = Object.entries(fuelMap).find(([k]) =>
    rawFuel.includes(k),
  )?.[1];

  // vehicleModelDate: "YYYY-MM" from yearMonth "YYYYMM"
  const ym: string = data?.category?.yearMonth ?? "";
  const vehicleModelDate =
    ym.length >= 6 ? `${ym.slice(0, 4)}-${ym.slice(4, 6)}` : undefined;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "Car",
    name: carName,
    image: [mainPhoto],
    description: `${carName} ${carData} — ${data?.spec?.mileage?.toLocaleString("en-US")} km. South Korean car on K-Axis.`,
    brand: {
      "@type": "Brand",
      name: normalizeBrand(data.category.manufacturerEnglishName) || "Unknown",
    },
    ...(data?.vin && { vehicleIdentificationNumber: data.vin }),
    ...(vehicleModelDate && { vehicleModelDate }),
    ...(data?.spec?.mileage && {
      mileageFromOdometer: {
        "@type": "QuantitativeValue",
        value: data.spec.mileage,
        unitCode: "KMT",
      },
    }),
    ...(data?.spec?.displacement && {
      vehicleEngine: {
        "@type": "EngineSpecification",
        engineDisplacement: {
          "@type": "QuantitativeValue",
          value: data.spec.displacement,
          unitCode: "CMQ",
        },
        ...(schemaFuel && { fuelType: schemaFuel }),
      },
    }),
    offers: {
      "@type": "Offer",
      url: `https://www.kmotors.shop/${lang}/catalog/${data?.vehicleId}`,
      // KRW намеренно: главная цена в карточке (CarDetailSidebar) — воны,
      // конвертация в ₽/$ идёт ниже как справочная. Валюта в разметке обязана
      // совпадать с видимой ценой, иначе Google бракует Offer.
      priceCurrency: "KRW",
      price: data?.advertisement?.price * 10000,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
      seller: {
        "@type": "Organization",
        name: "K-Axis",
        url: "https://www.kmotors.shop",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          currency: "USD",
          value: "1500",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "RU",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 7,
            maxValue: 14,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 14,
            maxValue: 30,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "RU",
        returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
      },
    },
  };

  const fullCarName = `${carName} ${carData}`;
  const krwPrice = data?.advertisement?.price
    ? data.advertisement.price * 10000
    : null;

  // Ищем совпадение в MODEL_PAGES для правильного catalogFilter
  const mfrLower = (data.category.manufacturerEnglishName ?? "").toLowerCase();
  const mdlClean = (data.category.modelGroupEnglishName ?? "")
    .split("(")[0]
    .replace(/THE NEW |NEW |ALL NEW /gi, "")
    .trim()
    .toLowerCase();
  const matchedModel = MODEL_PAGES.find(
    (m) =>
      mfrLower.includes(m.manufacturerEn.toLowerCase()) &&
      mdlClean.includes(m.modelEn.toLowerCase()),
  );
  const catalogFilter = matchedModel?.catalogFilter ?? "";
  const photoLabel =
    (
      { ru: "фото", en: "photo", ko: "사진", ka: "ფოტო", ar: "صورة" } as Record<
        string,
        string
      >
    )[lang] || "photo";

  // Sort: OUTER → OPTION → INNER, within each group sort by code ascending
  const TYPE_ORDER: Record<string, number> = { OUTER: 0, OPTION: 1, INNER: 2 };
  const sortedPhotos = [...(data.photos || [])].sort((a: any, b: any) => {
    const typeA = TYPE_ORDER[a.type] ?? 1;
    const typeB = TYPE_ORDER[b.type] ?? 1;
    if (typeA !== typeB) return typeA - typeB;
    return (a.code || "").localeCompare(b.code || "", undefined, {
      numeric: true,
    });
  });

  return (
    <div
      className="min-h-screen pb-24 lg:pb-0"
      style={{ backgroundColor: "var(--axis-black)" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Three column layout: [calculator] | [photos + specs] | [price + form + seller] */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr_300px] gap-5">
          {/* Col 1 — Калькулятор (sticky) */}
          {data?.advertisement?.price && (
            <div
              className="lg:sticky lg:top-[88px] lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto lg:overflow-x-hidden h-fit min-w-0 car-detail-dark order-2 lg:order-1"
              style={{ scrollbarWidth: "none" }}
            >
              <CustomsCalculator
                priceKRW={data.advertisement.price * 10000}
                yearMonth={data?.category?.yearMonth || ""}
                engineVolume={data?.spec?.displacement ?? 0}
                fuelType={data?.spec?.fuelName}
                carId={id}
                carName={fullCarName}
                lang={lang}
              />
            </div>
          )}

          {/* Col 2 — Заголовок + Фото, VIN, спеки, опции */}
          <div className="space-y-5 car-detail-dark min-w-0 overflow-hidden order-1 lg:order-2">
            {/* Car title — над фото, в центральной колонке */}
            <div>
              <h1
                className="text-2xl lg:text-3xl font-bold leading-tight"
                style={{ color: "var(--axis-white)" }}
              >
                {normalizeBrand(data.category.manufacturerEnglishName)}{" "}
                <span style={{ color: "var(--axis-orange)" }}>
                  {data.category.modelGroupEnglishName}
                </span>{" "}
                {/* Порядок комплектации — как в carName/title, чтобы H1 и
                    заголовок в выдаче совпадали слово в слово */}
                {data.category.gradeDetailEnglishName
                  ? `${data.category.gradeDetailEnglishName} `
                  : ""}
                {data.category.gradeEnglishName}
                {carYear ? ` ${carYear}` : ""} {fromKorea}
                {h1Tail && (
                  <span
                    className="block mt-1 text-base lg:text-lg font-medium"
                    style={{ color: "var(--axis-gray)" }}
                  >
                    {h1Tail}
                  </span>
                )}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: "rgba(255,69,0,0.12)",
                    color: "var(--axis-orange)",
                    border: "1px solid rgba(255,69,0,0.3)",
                  }}
                >
                  {carData}
                </span>
              </div>
            </div>
            <CarouselLight
              photos={sortedPhotos}
              carName={fullCarName}
              photoLabel={photoLabel}
            />

            {/* Цена — только мобиль, сразу под фото */}
            {data?.advertisement?.price && (
              <div
                className="lg:hidden rounded-2xl px-4 py-3 flex items-center justify-between"
                style={{
                  background:
                    "linear-gradient(135deg, var(--axis-orange), var(--axis-amber))",
                  boxShadow: "0 4px 20px rgba(255,69,0,0.25)",
                }}
              >
                <div>
                  <p className="text-white/70 text-xs mb-0.5">
                    {BUY_PRICE_LABEL[lang] ?? BUY_PRICE_LABEL.ru}
                  </p>
                  <p className="text-white text-2xl font-bold leading-tight">
                    {(data.advertisement.price * 10000).toLocaleString("ru-RU")}{" "}
                    <span className="text-base font-normal">
                      {WON_LABEL[lang] ?? WON_LABEL.ru}
                    </span>
                  </p>
                  {rates.krwToRub && (
                    <p className="text-white/80 text-sm mt-0.5">
                      ≈{" "}
                      {Math.round(
                        data.advertisement.price * 10000 * rates.krwToRub,
                      ).toLocaleString("ru-RU")}{" "}
                      ₽
                    </p>
                  )}
                </div>
              </div>
            )}
            {/* spec/options приходят от Encar не всегда — обращаемся через ?. */}
            <VinMileageSection
              vin={data.vin}
              vehicleNo={data.vehicleNo}
              mileage={data?.spec?.mileage}
            />
            {/* История авто грузится на сервере, но за Suspense: HTML карточки
                уходит сразу, а блок дописывается в тот же ответ — бот его видит. */}
            <Suspense fallback={<DetailInfoSkeleton />}>
              <DetailInfoSection id={data?.vehicleId} vehicleNo={data?.vehicleNo} />
            </Suspense>
            <OptionsRow data={data.options} />
          </div>

          {/* Col 3 — Цена, форма, продавец (sticky) */}
          <div
            className="lg:sticky lg:top-[88px] lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto lg:overflow-x-hidden h-fit min-w-0 order-3"
            style={{ scrollbarWidth: "none" }}
          >
            <CarDetailSidebar
              data={data}
              id={id}
              carName={fullCarName}
              krwToRub={rates.krwToRub}
              krwToUsd={rates.krwToUsd}
              lang={lang}
              priceKRW={data?.advertisement?.price * 10000}
              yearMonth={data?.category?.yearMonth}
              engineVolume={data?.spec?.displacement ?? 0}
              fuelType={data?.spec?.fuelName}
            />
          </div>
        </div>
      </div>

      {/* Рекомендуемые авто */}
      <RecommendedCars id={data?.vehicleId} lang={lang} />
      {/* Блок описания модели — виден пользователям и индексируется Google */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <CarDescription
          lang={lang}
          manufacturer={normalizeBrand(data.category.manufacturerEnglishName)}
          model={data.category.modelGroupEnglishName ?? ""}
          yearMonth={data?.category?.yearMonth ?? ""}
          mileage={data.spec?.mileage ?? 0}
          displacement={data.spec?.displacement ?? 0}
          fuelName={data.spec?.fuelName ?? ""}
          catalogFilter={catalogFilter}
        />
      </div>

      <StickyMobileCTA carId={id} carName={fullCarName} />
      <CarViewTracker
        carId={id}
        carName={fullCarName}
        price={krwPrice ?? undefined}
      />
    </div>
  );
};

export default Page;
