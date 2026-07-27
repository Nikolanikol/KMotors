// FAQ карточки авто: видимый блок + разметка FAQPage.
//
// Вопросы намеренно НЕ шаблонные — ответы про историю и растаможку собираются из
// данных конкретной машины. Одинаковый FAQ на тысячах карточек был бы балластом,
// а не контентом.
//
// Важно про ожидания: расширенных FAQ-сниппетов в выдаче не будет — с 2023 года
// Google показывает их только авторитетным гос- и медицинским сайтам. Ценность
// здесь в другом: уникальный текст на странице, извлечение в AI-ответы и снятие
// возражений покупателя до обращения к менеджеру.

import { fetchVehicleRecord } from "@/lib/vehicleRecord";

const FREIGHT_USD = 600; // морской фрахт до Владивостока; прочие направления — по запросу

interface Qa {
  q: string;
  a: string;
}

type Dict = {
  heading: string;
  history: (accidents: number, owners: number, paint: number | null) => Qa;
  historyClean: (owners: number) => Qa;
  customs: (car: string, cc: number, year: string) => Qa;
  delivery: Qa;
  inspection: Qa;
};

const money = (n: number, locale: string) => n.toLocaleString(locale);

const DICTS: Record<string, Dict> = {
  ru: {
    heading: "Частые вопросы об этом автомобиле",
    history: (accidents, owners, paint) => ({
      q: "Какая история у этого автомобиля?",
      a: `По базе страховых обращений Кореи зафиксировано обращений: ${accidents}${paint ? `, из них на окраску — ${money(paint, "ru-RU")} вон` : ""}. Владельцев: ${owners}. Полная выписка с датами и суммами приведена выше в блоке «История и статистика» — мы показываем её как есть, включая неудобные записи.`,
    }),
    historyClean: (owners) => ({
      q: "Какая история у этого автомобиля?",
      a: `Обращений по страховке не зафиксировано, автомобиль без ДТП по корейской базе. Владельцев: ${owners}. Полная выписка приведена выше в блоке «История и статистика».`,
    }),
    customs: (car, cc, year) => ({
      q: `Сколько стоит растаможить ${car} в России?`,
      a: `Пошлина считается от объёма двигателя (${cc} см³), года выпуска (${year}) и стоимости автомобиля. Точную сумму посчитает калькулятор растаможки слева на этой странице — для России, Казахстана и Узбекистана. Растаможка оплачивается отдельно от фрахта.`,
    }),
    delivery: {
      q: "Куда и за сколько вы доставляете?",
      a: `Мы отправляем автомобили по всему миру. Морской фрахт до Владивостока — ${FREIGHT_USD} долларов, стоимость доставки в другие страны рассчитываем по запросу. Весь путь от выкупа до выдачи занимает 3–6 недель. Мы работаем с нулевой комиссией: вы платите за автомобиль, фрахт и таможню, наших процентов сверху нет.`,
    },
    inspection: {
      q: "Можно ли осмотреть автомобиль перед покупкой?",
      a: "Да. После внесения задатка наш специалист выезжает к автомобилю в Корее, осматривает его лично и присылает подробный фото- и видеоотчёт, включая проблемные места. Если состояние не устроит — подбираем другой вариант.",
    },
  },
  en: {
    heading: "Frequently asked questions about this car",
    history: (accidents, owners, paint) => ({
      q: "What is this car's history?",
      a: `The Korean insurance database records ${accidents} claim(s)${paint ? `, including ${money(paint, "en-US")} KRW spent on painting` : ""}. Previous owners: ${owners}. The full record with dates and amounts is in the "History & Statistics" block above — we publish it as is, including the inconvenient entries.`,
    }),
    historyClean: (owners) => ({
      q: "What is this car's history?",
      a: `No insurance claims are recorded — the car is accident-free according to the Korean database. Previous owners: ${owners}. The full record is in the "History & Statistics" block above.`,
    }),
    customs: (car, cc, year) => ({
      q: `How much does it cost to clear customs for a ${car}?`,
      a: `Duty depends on engine displacement (${cc} cc), year of manufacture (${year}) and the vehicle's value. The customs calculator on this page gives the exact figure for Russia, Kazakhstan and Uzbekistan. Customs duty is paid separately from freight.`,
    }),
    delivery: {
      q: "Where do you ship, and how much does it cost?",
      a: `We ship cars worldwide. Sea freight to Vladivostok is $${FREIGHT_USD}; shipping cost to other destinations is quoted on request. The whole process from purchase to handover takes 3–6 weeks. We work on zero commission: you pay for the car, freight and customs — we add no percentage on top.`,
    },
    inspection: {
      q: "Can the car be inspected before purchase?",
      a: "Yes. After the deposit, our specialist visits the car in Korea, inspects it in person and sends a detailed photo and video report, including any problem areas. If you are not happy with the condition, we find another car.",
    },
  },
  ka: {
    heading: "ხშირად დასმული კითხვები ამ ავტომობილზე",
    history: (accidents, owners, paint) => ({
      q: "როგორია ამ ავტომობილის ისტორია?",
      a: `კორეის სადაზღვევო ბაზაში დაფიქსირებულია ${accidents} მიმართვა${paint ? `, მათ შორის ღებვაზე — ${money(paint, "en-US")} ვონი` : ""}. მფლობელები: ${owners}. სრული ამონაწერი თარიღებითა და თანხებით მოცემულია ზემოთ, ბლოკში „ისტორია და სტატისტიკა“.`,
    }),
    historyClean: (owners) => ({
      q: "როგორია ამ ავტომობილის ისტორია?",
      a: `სადაზღვევო მიმართვები არ დაფიქსირებულა — ავტომობილი უავარიოა კორეული ბაზის მიხედვით. მფლობელები: ${owners}. სრული ამონაწერი მოცემულია ზემოთ.`,
    }),
    customs: (car, cc, year) => ({
      q: `რამდენი ღირს ${car}-ის განბაჟება?`,
      a: `გადასახადი დამოკიდებულია ძრავის მოცულობაზე (${cc} სმ³), გამოშვების წელზე (${year}) და ავტომობილის ღირებულებაზე. ზუსტ თანხას გამოთვლის განბაჟების კალკულატორი ამ გვერდზე. განბაჟება ფრახტისგან ცალკე იხდება.`,
    }),
    delivery: {
      q: "სად და რა ღირებულებით ახორციელებთ მიტანას?",
      a: `ჩვენ ვგზავნით ავტომობილებს მსოფლიოს ნებისმიერ ქვეყანაში. საზღვაო ფრახტი ვლადივოსტოკამდე — ${FREIGHT_USD} დოლარი, სხვა მიმართულებების ღირებულებას ვითვლით მოთხოვნისამებრ. მთელი პროცესი გრძელდება 3–6 კვირა. ვმუშაობთ ნულოვანი საკომისიოთი.`,
    },
    inspection: {
      q: "შესაძლებელია თუ არა ავტომობილის დათვალიერება ყიდვამდე?",
      a: "დიახ. წინასწარი გადახდის შემდეგ ჩვენი სპეციალისტი პირადად ათვალიერებს ავტომობილს კორეაში და გიგზავნით დეტალურ ფოტო და ვიდეო ანგარიშს, პრობლემური ადგილების ჩათვლით.",
    },
  },
  ar: {
    heading: "أسئلة شائعة حول هذه السيارة",
    history: (accidents, owners, paint) => ({
      q: "ما هو تاريخ هذه السيارة؟",
      a: `تسجّل قاعدة بيانات التأمين الكورية ${accidents} مطالبة${paint ? `، منها ${money(paint, "en-US")} وون على الطلاء` : ""}. عدد المُلاك السابقين: ${owners}. السجل الكامل بالتواريخ والمبالغ موجود أعلاه في قسم «التاريخ والإحصائيات».`,
    }),
    historyClean: (owners) => ({
      q: "ما هو تاريخ هذه السيارة؟",
      a: `لا توجد مطالبات تأمين مسجّلة — السيارة بدون حوادث وفقًا لقاعدة البيانات الكورية. عدد المُلاك السابقين: ${owners}. السجل الكامل موجود أعلاه.`,
    }),
    customs: (car, cc, year) => ({
      q: `كم تبلغ تكلفة التخليص الجمركي لسيارة ${car}؟`,
      a: `تعتمد الرسوم على سعة المحرك (${cc} سم³) وسنة الصنع (${year}) وقيمة السيارة. تحسب الآلة الحاسبة في هذه الصفحة المبلغ الدقيق. تُدفع الرسوم الجمركية بشكل منفصل عن الشحن.`,
    }),
    delivery: {
      q: "إلى أين تشحنون وكم تبلغ التكلفة؟",
      a: `نشحن السيارات إلى جميع دول العالم. الشحن البحري إلى فلاديفوستوك ${FREIGHT_USD} دولار، وتكلفة الشحن إلى الوجهات الأخرى تُحدَّد عند الطلب. تستغرق العملية كاملةً من الشراء إلى التسليم 3–6 أسابيع. نعمل بدون عمولة.`,
    },
    inspection: {
      q: "هل يمكن فحص السيارة قبل الشراء؟",
      a: "نعم. بعد دفع العربون، يزور متخصصنا السيارة في كوريا ويفحصها شخصيًا ويرسل تقريرًا مفصلًا بالصور والفيديو، بما في ذلك أي عيوب.",
    },
  },
};

export default async function CarFaq({
  lang,
  carName,
  vehicleId,
  vehicleNo,
  displacement,
  year,
}: {
  lang: string;
  carName: string;
  vehicleId: string | number | undefined;
  vehicleNo: string | undefined;
  displacement: number;
  year: string;
}) {
  const d = DICTS[lang] ?? DICTS.ru;
  // Кэш 1 ч и дедупликация с DetailInfoSection — дополнительного похода в Encar нет.
  const record = await fetchVehicleRecord(vehicleId, vehicleNo);

  const items: Qa[] = [];

  // Вопрос про историю добавляем ТОЛЬКО если данные действительно есть:
  // выдумывать «без ДТП» при недоступном апстриме нельзя.
  if (record) {
    const accidents = (record.myAccidentCnt ?? 0) + (record.otherAccidentCnt ?? 0);
    const owners = record.ownerChangeCnt ?? 0;
    const paint =
      record.accidents?.reduce((sum, a) => sum + (a.paintingCost ?? 0), 0) || null;
    items.push(accidents > 0 ? d.history(accidents, owners, paint) : d.historyClean(owners));
  }

  if (displacement > 0) items.push(d.customs(carName, displacement, year));
  items.push(d.delivery);
  items.push(d.inspection);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="flex items-center gap-2 mb-5">
        <span
          className="w-1 h-6 rounded-full"
          style={{
            background:
              "linear-gradient(to bottom, var(--axis-orange), var(--axis-amber))",
          }}
        />
        <h2 className="text-xl font-bold" style={{ color: "var(--axis-white)" }}>
          {d.heading}
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(({ q, a }) => (
          <div
            key={q}
            className="rounded-2xl p-5"
            style={{
              backgroundColor: "var(--axis-charcoal)",
              border: "1px solid rgba(74,74,74,0.3)",
            }}
          >
            <h3
              className="text-sm font-semibold mb-2"
              style={{ color: "var(--axis-white)" }}
            >
              {q}
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--axis-gray)" }}
            >
              {a}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
