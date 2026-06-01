import type { Metadata } from "next";

const PRIVACY_META: Record<string, { title: string; description: string }> = {
  ru: {
    title: "Политика конфиденциальности",
    description: "Политика конфиденциальности K-Axis — как мы собираем, используем и защищаем ваши данные.",
  },
  en: {
    title: "Privacy Policy",
    description: "K-Axis Privacy Policy — how we collect, use and protect your data.",
  },
  ko: {
    title: "개인정보 처리방침",
    description: "K-Axis 개인정보 처리방침 — 데이터 수집, 사용 및 보호 방법.",
  },
  ka: {
    title: "კონფიდენციალურობის პოლიტიკა",
    description: "K-Axis კონფიდენციალურობის პოლიტიკა — როგორ ვაგროვებთ, ვიყენებთ და ვიცავთ თქვენს მონაცემებს.",
  },
  ar: {
    title: "سياسة الخصوصية",
    description: "سياسة خصوصية K-Axis — كيف نجمع بياناتك ونستخدمها ونحميها.",
  },
};

const PRIVACY_CONTENT: Record<string, {
  lastUpdated: string;
  sections: { title: string; text: string }[];
}> = {
  ru: {
    lastUpdated: "16 мая 2026 г.",
    sections: [
      {
        title: "1. Какие данные мы собираем",
        text: "Мы можем собирать следующие данные: имя и контактные данные (телефон, Telegram, WhatsApp), которые вы предоставляете при заполнении форм заявок; данные об использовании сайта (страницы, время визита) через Google Analytics и Microsoft Clarity; технические данные (IP-адрес, тип браузера, устройство).",
      },
      {
        title: "2. Как мы используем ваши данные",
        text: "Мы используем ваши данные для: обработки заявок и связи с вами по вопросам покупки автомобиля; улучшения работы сайта на основе аналитики; ответа на ваши вопросы через Telegram и WhatsApp.",
      },
      {
        title: "3. Cookies",
        text: "Сайт использует cookies для: сохранения выбранного языка интерфейса; аналитики посещаемости (Google Analytics, Microsoft Clarity). Вы можете отключить cookies в настройках браузера, однако некоторые функции сайта могут перестать работать корректно.",
      },
      {
        title: "4. Передача данных третьим лицам",
        text: "Мы не продаём и не передаём ваши персональные данные третьим лицам, за исключением: сервисов аналитики (Google Analytics, Microsoft Clarity) в обезличенном виде; случаев, предусмотренных законодательством.",
      },
      {
        title: "5. Хранение данных",
        text: "Данные, переданные через формы заявок, хранятся в защищённой базе данных и используются исключительно для обработки вашего запроса. Аналитические данные хранятся в соответствии с политиками Google и Microsoft.",
      },
      {
        title: "6. Ваши права",
        text: "Вы вправе запросить доступ к своим данным, потребовать их исправления или удаления. Для этого свяжитесь с нами через Telegram: @avto_korea_nikolai или по телефону +82 10-5865-4344.",
      },
      {
        title: "7. Контакты",
        text: "По вопросам конфиденциальности: Telegram @avto_korea_nikolai, телефон +82 10-5865-4344. K-Axis, 경기도 수원시 권선구 권선로 308-5 103호 1층, Южная Корея.",
      },
    ],
  },
  en: {
    lastUpdated: "May 16, 2026",
    sections: [
      {
        title: "1. What data we collect",
        text: "We may collect the following data: name and contact details (phone, Telegram, WhatsApp) you provide when filling out request forms; site usage data (pages visited, time of visit) via Google Analytics and Microsoft Clarity; technical data (IP address, browser type, device).",
      },
      {
        title: "2. How we use your data",
        text: "We use your data to: process requests and contact you about car purchases; improve site performance based on analytics; respond to your questions via Telegram and WhatsApp.",
      },
      {
        title: "3. Cookies",
        text: "The site uses cookies to: save your selected interface language; track site analytics (Google Analytics, Microsoft Clarity). You can disable cookies in your browser settings, though some site features may not function correctly.",
      },
      {
        title: "4. Data sharing",
        text: "We do not sell or share your personal data with third parties, except: analytics services (Google Analytics, Microsoft Clarity) in anonymized form; cases required by law.",
      },
      {
        title: "5. Data storage",
        text: "Data submitted through request forms is stored in a secure database and used solely to process your request. Analytics data is stored in accordance with Google and Microsoft policies.",
      },
      {
        title: "6. Your rights",
        text: "You have the right to request access to your data, request its correction or deletion. To do so, contact us via Telegram: @avto_korea_nikolai or by phone +82 10-5865-4344.",
      },
      {
        title: "7. Contact",
        text: "For privacy inquiries: Telegram @avto_korea_nikolai, phone +82 10-5865-4344. K-Axis, 경기도 수원시 권선구 권선로 308-5 103호 1층, South Korea.",
      },
    ],
  },
  ko: {
    lastUpdated: "2026년 5월 16일",
    sections: [
      {
        title: "1. 수집하는 데이터",
        text: "당사는 다음 데이터를 수집할 수 있습니다: 신청서 작성 시 제공하는 이름 및 연락처(전화, 텔레그램, WhatsApp); Google Analytics 및 Microsoft Clarity를 통한 사이트 이용 데이터(방문 페이지, 방문 시간); 기술 데이터(IP 주소, 브라우저 유형, 기기).",
      },
      {
        title: "2. 데이터 사용 방법",
        text: "당사는 다음 목적으로 데이터를 사용합니다: 자동차 구매 관련 요청 처리 및 연락; 분석을 통한 사이트 성능 개선; 텔레그램 및 WhatsApp을 통한 문의 응답.",
      },
      {
        title: "3. 쿠키",
        text: "사이트는 다음 목적으로 쿠키를 사용합니다: 선택한 인터페이스 언어 저장; 사이트 분석(Google Analytics, Microsoft Clarity). 브라우저 설정에서 쿠키를 비활성화할 수 있지만 일부 기능이 올바르게 작동하지 않을 수 있습니다.",
      },
      {
        title: "4. 제3자 데이터 공유",
        text: "당사는 다음 경우를 제외하고 개인 데이터를 제3자에게 판매하거나 공유하지 않습니다: 익명화된 분석 서비스(Google Analytics, Microsoft Clarity); 법률에서 요구하는 경우.",
      },
      {
        title: "5. 데이터 보관",
        text: "신청서를 통해 제출된 데이터는 보안 데이터베이스에 저장되며 요청 처리에만 사용됩니다. 분석 데이터는 Google 및 Microsoft 정책에 따라 저장됩니다.",
      },
      {
        title: "6. 귀하의 권리",
        text: "데이터 접근, 수정 또는 삭제를 요청할 권리가 있습니다. 텔레그램 @avto_korea_nikolai 또는 전화 +82 10-5865-4344로 문의하세요.",
      },
      {
        title: "7. 연락처",
        text: "개인정보 문의: 텔레그램 @avto_korea_nikolai, 전화 +82 10-5865-4344. K-Axis, 경기도 수원시 권선구 권선로 308-5 103호 1층, 대한민국.",
      },
    ],
  },
  ka: {
    lastUpdated: "16 მაისი, 2026",
    sections: [
      {
        title: "1. რა მონაცემებს ვაგროვებთ",
        text: "შეგვიძლია შევაგროვოთ: სახელი და საკონტაქტო ინფორმაცია (ტელეფონი, Telegram, WhatsApp) — განაცხადების ფორმების შევსებისას; საიტის გამოყენების მონაცემები Google Analytics-ისა და Microsoft Clarity-ის საშუალებით; ტექნიკური მონაცემები (IP მისამართი, ბრაუზერის ტიპი, მოწყობილობა).",
      },
      {
        title: "2. როგორ ვიყენებთ მონაცემებს",
        text: "მონაცემებს ვიყენებთ: განაცხადების დამუშავებისა და ავტომობილის შეძენასთან დაკავშირებული საკითხებისთვის; საიტის გასაუმჯობესებლად; Telegram-ისა და WhatsApp-ის საშუალებით კითხვებზე პასუხისთვის.",
      },
      {
        title: "3. Cookies",
        text: "საიტი იყენებს cookies: ინტერფეისის ენის შესანახად; ვიზიტორთა ანალიტიკისთვის. შეგიძლიათ გამორთოთ cookies ბრაუზერის პარამეტრებში.",
      },
      {
        title: "4. მონაცემთა გაზიარება",
        text: "პერსონალურ მონაცემებს არ ვყიდით და არ ვუზიარებთ მესამე მხარეებს, გარდა: ანონიმური ანალიტიკური სერვისებისა; კანონმდებლობით გათვალისწინებული შემთხვევებისა.",
      },
      {
        title: "5. მონაცემთა შენახვა",
        text: "ფორმებით გადაცემული მონაცემები ინახება დაცულ მონაცემთა ბაზაში და გამოიყენება მხოლოდ თქვენი მოთხოვნის დასამუშავებლად.",
      },
      {
        title: "6. თქვენი უფლებები",
        text: "გაქვთ უფლება მოითხოვოთ მონაცემებზე წვდომა, მათი შესწორება ან წაშლა. დაგვიკავშირდით Telegram-ზე: @avto_korea_nikolai ან ტელეფონით +82 10-5865-4344.",
      },
      {
        title: "7. კონტაქტი",
        text: "კონფიდენციალურობის საკითხებზე: Telegram @avto_korea_nikolai, ტელეფონი +82 10-5865-4344. K-Axis, 경기도 수원시 권선구 권선로 308-5 103호 1층, სამხრეთ კორეა.",
      },
    ],
  },
  ar: {
    lastUpdated: "16 مايو 2026",
    sections: [
      {
        title: "1. البيانات التي نجمعها",
        text: "قد نجمع البيانات التالية: الاسم وبيانات الاتصال (هاتف، تيليغرام، واتساب) التي تقدمها عند ملء نماذج الطلبات؛ بيانات استخدام الموقع عبر Google Analytics وMicrosoft Clarity؛ البيانات التقنية (عنوان IP، نوع المتصفح، الجهاز).",
      },
      {
        title: "2. كيف نستخدم بياناتك",
        text: "نستخدم بياناتك لـ: معالجة الطلبات والتواصل معك بشأن شراء السيارات؛ تحسين أداء الموقع بناءً على التحليلات؛ الرد على أسئلتك عبر تيليغرام وواتساب.",
      },
      {
        title: "3. ملفات تعريف الارتباط (Cookies)",
        text: "يستخدم الموقع ملفات تعريف الارتباط لـ: حفظ لغة الواجهة المختارة؛ تتبع إحصائيات الموقع (Google Analytics، Microsoft Clarity). يمكنك تعطيل ملفات تعريف الارتباط في إعدادات المتصفح.",
      },
      {
        title: "4. مشاركة البيانات مع أطراف ثالثة",
        text: "لا نبيع بياناتك الشخصية ولا نشاركها مع أطراف ثالثة، باستثناء: خدمات التحليلات بصورة مجهولة الهوية؛ الحالات التي يستوجبها القانون.",
      },
      {
        title: "5. تخزين البيانات",
        text: "تُخزَّن البيانات المُرسَلة عبر نماذج الطلبات في قاعدة بيانات آمنة وتُستخدم فقط لمعالجة طلبك.",
      },
      {
        title: "6. حقوقك",
        text: "يحق لك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها. تواصل معنا عبر تيليغرام: @avto_korea_nikolai أو هاتف +82 10-5865-4344.",
      },
      {
        title: "7. التواصل",
        text: "لاستفسارات الخصوصية: تيليغرام @avto_korea_nikolai، هاتف +82 10-5865-4344. K-Axis، 경기도 수원시 권선구 권선로 308-5 103호 1층، كوريا الجنوبية.",
      },
    ],
  },
};

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const meta = PRIVACY_META[lang] || PRIVACY_META.ru;

  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false },
    alternates: {
      canonical: `https://www.kmotors.shop/${lang}/privacy`,
    },
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { lang } = await params;
  const content = PRIVACY_CONTENT[lang] || PRIVACY_CONTENT.ru;
  const meta = PRIVACY_META[lang] || PRIVACY_META.ru;

  const headings: Record<string, string> = {
    ru: "Политика конфиденциальности",
    en: "Privacy Policy",
    ko: "개인정보 처리방침",
    ka: "კონფიდენციალურობის პოლიტიკა",
    ar: "سياسة الخصوصية",
  };

  const updatedLabels: Record<string, string> = {
    ru: "Последнее обновление:",
    en: "Last updated:",
    ko: "최종 업데이트:",
    ka: "ბოლო განახლება:",
    ar: "آخر تحديث:",
  };

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <section className="bg-gradient-to-br from-[#002C5F] to-[#001f45] py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            {headings[lang] || headings.ru}
          </h1>
          <p className="text-white/50 text-sm mt-3">
            {updatedLabels[lang] || updatedLabels.ru} {content.lastUpdated}
          </p>
          <p className="text-white/60 text-sm mt-1">{meta.description}</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <article className="rounded-2xl p-6 md:p-10 space-y-6" style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}>
          {content.sections.map((section) => (
            <section key={section.title} className="space-y-2 pb-6 border-b last:border-0 last:pb-0" style={{ borderColor: "rgba(74,74,74,0.2)" }}>
              <h2 className="text-base font-semibold" style={{ color: "var(--axis-white)" }}>
                {section.title}
              </h2>
              <p className="leading-relaxed text-sm" style={{ color: "var(--axis-gray)" }}>
                {section.text}
              </p>
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}
