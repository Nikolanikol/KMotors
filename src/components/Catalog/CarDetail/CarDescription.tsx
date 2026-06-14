import Link from "next/link";

interface Props {
  lang: string;
  manufacturer: string;
  model: string;
  yearMonth: string;
  mileage: number;
  displacement: number;
  fuelName: string;
  catalogFilter: string;
}

type LangTexts = {
  title: (mfr: string, mdl: string) => string;
  p1: (mfr: string, mdl: string, year: string, disp: string | null, fuel: string, km: string, mileage: number) => string;
  p2: (mfr: string, mdl: string, mileage: number) => string;
  tagOrigin: (mfr: string, mdl: string) => string;
  fuelShort: (raw: string) => string;
  kmUnit: string;
  dispUnit: string;
  link: (mfr: string, mdl: string) => string;
};

const TEXTS: Record<string, LangTexts> = {
  ru: {
    title: (mfr, mdl) => `О модели ${mfr} ${mdl}`,
    p1: (mfr, mdl, year, disp, fuel, km, mileage) =>
      `${mfr} ${mdl} ${year} года — автомобиль с ${disp ? `${disp}-литровым ` : ""}${fuel} двигателем${mileage > 0 ? ` и пробегом ${km} км` : ""}. ` +
      `Приобретён на корейском вторичном рынке и доступен для заказа через K-Axis с личным осмотром в Сувоне (Республика Корея).`,
    p2: (mfr, mdl, mileage) =>
      `Покупка ${mfr} ${mdl} из Кореи — это возможность получить автомобиль` +
      `${mileage > 0 && mileage < 50000 ? " с небольшим пробегом " : " "}` +
      `в оригинальной корейской комплектации по цене ниже российского рынка. ` +
      `Доставка морем до Владивостока занимает 7–14 дней, полный срок с таможенным оформлением — 3–6 недель.`,
    tagOrigin: (mfr, mdl) => `${mfr} ${mdl} из Кореи`,
    fuelShort: (raw) => {
      if (raw.includes("가솔린")) return "бензин";
      if (raw.includes("디젤")) return "дизель";
      if (raw.includes("전기")) return "электро";
      if (raw.includes("플러그인")) return "plug-in гибрид";
      if (raw.includes("하이브리드")) return "гибрид";
      if (raw.includes("LPG") || raw.includes("lpg")) return "LPG";
      return "бензин";
    },
    kmUnit: "км",
    dispUnit: "л",
    link: (mfr, mdl) => `Все ${mfr} ${mdl} в каталоге →`,
  },
  en: {
    title: (mfr, mdl) => `About ${mfr} ${mdl}`,
    p1: (mfr, mdl, year, disp, fuel, km, mileage) =>
      `${mfr} ${mdl} ${year} — a car with a${disp ? ` ${disp}-litre` : ""} ${fuel} engine` +
      `${mileage > 0 ? ` and ${km} km on the odometer` : ""}. ` +
      `Sourced from the Korean used-car market and available to order via K-Axis with a personal inspection in Suwon, South Korea.`,
    p2: (mfr, mdl, mileage) =>
      `Buying a ${mfr} ${mdl} from Korea means getting a car` +
      `${mileage > 0 && mileage < 50000 ? " with low mileage" : ""}` +
      ` in its original Korean specification at a price below the local market. ` +
      `Sea delivery to Vladivostok takes 7–14 days; the full process including customs clearance takes 3–6 weeks.`,
    tagOrigin: (mfr, mdl) => `${mfr} ${mdl} from Korea`,
    fuelShort: (raw) => {
      if (raw.includes("가솔린")) return "gasoline";
      if (raw.includes("디젤")) return "diesel";
      if (raw.includes("전기")) return "electric";
      if (raw.includes("플러그인")) return "plug-in hybrid";
      if (raw.includes("하이브리드")) return "hybrid";
      if (raw.includes("LPG") || raw.includes("lpg")) return "LPG";
      return "gasoline";
    },
    kmUnit: "km",
    dispUnit: "L",
    link: (mfr, mdl) => `All ${mfr} ${mdl} in catalogue →`,
  },
  ar: {
    title: (mfr, mdl) => `حول ${mfr} ${mdl}`,
    p1: (mfr, mdl, year, disp, fuel, km, mileage) =>
      `${mfr} ${mdl} ${year} — سيارة تعمل بمحرك ${fuel}${disp ? ` بسعة ${disp} لتر` : ""}` +
      `${mileage > 0 ? ` وعداد مسافة ${km} كم` : ""}. ` +
      `مصدرها السوق الكوري للسيارات المستعملة، ومتاحة للطلب عبر K-Axis مع فحص شخصي في سوون، كوريا الجنوبية.`,
    p2: (mfr, mdl, mileage) =>
      `شراء ${mfr} ${mdl} من كوريا يعني الحصول على سيارة` +
      `${mileage > 0 && mileage < 50000 ? " بعداد منخفض" : ""}` +
      ` بمواصفاتها الكورية الأصلية بسعر أقل من السوق المحلية. ` +
      `يستغرق الشحن البحري إلى فلاديفوستوك 7–14 يومًا؛ العملية الكاملة شاملةً التخليص الجمركي 3–6 أسابيع.`,
    tagOrigin: (mfr, mdl) => `${mfr} ${mdl} من كوريا`,
    fuelShort: (raw) => {
      if (raw.includes("가솔린")) return "بنزين";
      if (raw.includes("디젤")) return "ديزل";
      if (raw.includes("전기")) return "كهربائي";
      if (raw.includes("플러그인")) return "هجين قابل للشحن";
      if (raw.includes("하이브리드")) return "هجين";
      if (raw.includes("LPG") || raw.includes("lpg")) return "LPG";
      return "بنزين";
    },
    kmUnit: "كم",
    dispUnit: "L",
    link: (mfr, mdl) => `جميع ${mfr} ${mdl} في الكتالوج ←`,
  },
  ka: {
    title: (mfr, mdl) => `${mfr} ${mdl}-ის შესახებ`,
    p1: (mfr, mdl, year, disp, fuel, km, mileage) =>
      `${mfr} ${mdl} ${year} — ავტომობილი${disp ? ` ${disp}-ლიტრიანი` : ""} ${fuel} ძრავით` +
      `${mileage > 0 ? `, გარბენი ${km} კმ` : ""}. ` +
      `შეძენილია კორეის მეორადი ავტომობილების ბაზარზე და ხელმისაწვდომია K-Axis-ის მეშვეობით, სუვონში (კორეის რესპუბლიკა) პირადი დათვალიერებით.`,
    p2: (mfr, mdl, mileage) =>
      `${mfr} ${mdl}-ის კორეიდან შეძენა ნიშნავს ავტომობილის მიღებას` +
      `${mileage > 0 && mileage < 50000 ? " დაბალი გარბენით" : ""}` +
      ` ორიგინალ კორეულ კომპლექტაციაში ადგილობრივ ბაზარზე დაბალ ფასად. ` +
      `საზღვაო მიტანა ვლადივოსტოკამდე 7–14 დღეს მოითხოვს; სრული პროცესი საბაჟო გაფორმებით — 3–6 კვირა.`,
    tagOrigin: (mfr, mdl) => `${mfr} ${mdl} კორეიდან`,
    fuelShort: (raw) => {
      if (raw.includes("가솔린")) return "ბენზინი";
      if (raw.includes("디젤")) return "დიზელი";
      if (raw.includes("전기")) return "ელექტრო";
      if (raw.includes("플러그인")) return "plug-in ჰიბრიდი";
      if (raw.includes("하이브리드")) return "ჰიბრიდი";
      if (raw.includes("LPG") || raw.includes("lpg")) return "LPG";
      return "ბენზინი";
    },
    kmUnit: "კმ",
    dispUnit: "ლ",
    link: (mfr, mdl) => `ყველა ${mfr} ${mdl} კატალოგში →`,
  },
  ko: {
    title: (mfr, mdl) => `${mfr} ${mdl} 정보`,
    p1: (mfr, mdl, year, disp, fuel, km, mileage) =>
      `${mfr} ${mdl} ${year}년식 — ${disp ? `${disp}L ` : ""}${fuel} 엔진 탑재` +
      `${mileage > 0 ? `, 주행거리 ${km}km` : ""}. ` +
      `한국 중고차 시장에서 직수입되며, 수원(대한민국)에서 직접 차량 검사 후 K-Axis를 통해 주문 가능합니다.`,
    p2: (mfr, mdl, mileage) =>
      `한국에서 ${mfr} ${mdl}을(를) 구매하면 현지 시장보다 저렴한 가격으로 정품 한국 사양의 차량을` +
      `${mileage > 0 && mileage < 50000 ? " 저주행 상태로" : ""}` +
      ` 받을 수 있습니다. ` +
      `블라디보스토크까지 해상 운송은 7–14일이 소요되며, 통관을 포함한 전체 과정은 3–6주입니다.`,
    tagOrigin: (mfr, mdl) => `한국산 ${mfr} ${mdl}`,
    fuelShort: (raw) => {
      if (raw.includes("가솔린")) return "가솔린";
      if (raw.includes("디젤")) return "디젤";
      if (raw.includes("전기")) return "전기";
      if (raw.includes("플러그인")) return "플러그인 하이브리드";
      if (raw.includes("하이브리드")) return "하이브리드";
      if (raw.includes("LPG") || raw.includes("lpg")) return "LPG";
      return "가솔린";
    },
    kmUnit: "km",
    dispUnit: "L",
    link: (mfr, mdl) => `카탈로그에서 ${mfr} ${mdl} 전체 보기 →`,
  },
};

function formatDisplacement(cc: number): string {
  if (!cc || cc < 100) return "";
  return (cc / 1000).toFixed(1);
}

function formatMileage(km: number, lang: string): string {
  return km.toLocaleString(lang === "ru" ? "ru-RU" : "en-US");
}

export default function CarDescription({
  lang, manufacturer, model,
  mileage, displacement, fuelName, catalogFilter, yearMonth,
}: Props) {
  const t = TEXTS[lang] ?? TEXTS.en;
  const mfr = manufacturer.trim();
  const mdl = model.split("(")[0].replace(/THE NEW |NEW |ALL NEW /gi, "").trim();
  const year = yearMonth?.length >= 4 ? yearMonth.slice(0, 4) : yearMonth;
  const disp = displacement ? formatDisplacement(displacement) : null;
  const fuel = t.fuelShort(fuelName);
  const km = formatMileage(mileage, lang);

  const tags = [
    t.tagOrigin(mfr, mdl),
    year,
    ...(disp ? [`${disp} ${t.dispUnit} · ${fuel}`] : []),
    ...(mileage > 0 ? [`${km} ${t.kmUnit}`] : []),
  ];

  return (
    <div
      className="mt-6 rounded-2xl p-6 space-y-4"
      style={{
        backgroundColor: "var(--axis-charcoal)",
        border: "1px solid rgba(74,74,74,0.25)",
      }}
    >
      <h2 className="text-base font-semibold" style={{ color: "var(--axis-white)" }}>
        {t.title(mfr, mdl)}
      </h2>

      <p className="text-sm leading-relaxed" style={{ color: "var(--axis-gray)" }}>
        {t.p1(mfr, mdl, year, disp, fuel, km, mileage)}
      </p>

      <p className="text-sm leading-relaxed" style={{ color: "var(--axis-gray)" }}>
        {t.p2(mfr, mdl, mileage)}
      </p>

      <div className="flex flex-wrap gap-2 pt-1">
        {tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: "rgba(255,69,0,0.08)",
              color: "var(--axis-orange)",
              border: "1px solid rgba(255,69,0,0.2)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      <Link
        href={`/${lang}/catalog?${catalogFilter ? `action=${catalogFilter}&` : ""}page=1`}
        className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        style={{ color: "var(--axis-orange)" }}
      >
        {t.link(mfr, mdl)}
      </Link>
    </div>
  );
}
