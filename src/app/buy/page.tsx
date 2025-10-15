import { Metadata } from "next";
import {
  Search,
  FileText,
  CreditCard,
  Truck,
  MapPin,
  CheckCircle,
  Anchor,
} from "lucide-react";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Как купить автомобиль из Кореи | K Motors - Пошаговая инструкция",
  description:
    "Подробная инструкция как купить автомобиль из Южной Кореи через K Motors. 8 этапов: от выбора до получения. Честная цена, гарантия, таможенное оформление.",
  keywords:
    "как купить авто из Кореи, покупка автомобиля из Южной Кореи, K Motors, Hyundai, Kia, Genesis",
  openGraph: {
    title: "Как купить автомобиль из Кореи | K Motors",
    description:
      "Полная инструкция по покупке автомобиля из Южной Кореи. 8 простых этапов, гарантия, таможенное оформление.",
    url: "https://kmotors.shop/how-to-buy",
    siteName: "Kmotors",
    images: [
      {
        url: "https://kmotors.shop/preview/preview.png",
        width: 1200,
        height: 630,
        alt: "Как купить автомобиль из Кореи",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Как купить автомобиль из Кореи | K Motors",
    description: "Пошаговая инструкция покупки автомобиля из Южной Кореи",
  },
};

const steps = [
  {
    number: 1,
    title: "Выберите автомобиль",
    description:
      "Изучите наш каталог автомобилей из Южной Кореи. Фильтруйте по марке, модели, году выпуска и цене. Найдите идеальный вариант для вас.",
    icon: Search,
    highlight: null,
  },
  {
    number: 2,
    title: "Внесите задаток",
    description:
      "Внесите задаток в размере 2 000 000 вон от стоимости автомобиля. Мы зарезервируем машину за вами и начнём оформление документов.",
    icon: CreditCard,
    highlight:
      "Все средства застрахованы и гарантированно вернутся, если автомобиль не подойдёт.",
  },
  {
    number: 3,
    title: "Проверка и осмотр",
    description:
      "Наш специалист проводит полный осмотр автомобиля в Южной Корее. Вы получите фото и видео отчёт со всеми деталями.",
    icon: FileText,
    highlight: null,
  },
  {
    number: 4,
    title: "Оплата остатка",
    description:
      "После подтверждения, вносите оставшуюся часть платежа. Мы выкупаем автомобиль и начинаем подготовку машины к экспорту.",
    icon: CreditCard,
    highlight: null,
  },
  {
    number: 5,
    title: "Таможенное оформление",
    description:
      "Наша команда берёт на себя все таможенные процедуры. Автомобиль оформляется для экспорта в Россию со всеми необходимыми документами.",
    icon: Anchor,
    highlight: null,
  },
  {
    number: 6,
    title: "Доставка в Россию",
    description:
      "Автомобиль отправляется в Россию по морю. Мы отслеживаем каждый этап доставки и держим вас в курсе.",
    icon: Truck,
    highlight:
      "Доставка до Владивостока обычно занимает 7-14 дней в зависимости от пункта назначения.",
  },
  {
    number: 7,
    title: "Растаможивание",
    description:
      "При прибытии в Россию мы помогаем с растаможиванием. Все сборы и налоги оплачиваются согласно российскому законодательству.",
    icon: MapPin,
    highlight: null,
  },
  {
    number: 8,
    title: "Получение автомобиля",
    description:
      "Ваш автомобиль готов к получению! Мы передадим вам машину со всеми необходимыми документами и ключами.",
    icon: CheckCircle,
    highlight:
      "Поздравляем! Теперь ваш новый автомобиль готов к использованию.",
  },
];

const schemaData = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Как купить автомобиль из Кореи",
  description:
    "Полная инструкция по процессу покупки автомобиля из Южной Кореи через K Motors. 8 простых этапов от выбора до получения.",
  image: "https://kmotors.shop/preview/preview.png",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Выберите автомобиль",
      description:
        "Изучите наш каталог автомобилей из Южной Кореи. Фильтруйте по марке, модели, году выпуска и цене.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Внесите задаток",
      description:
        "Внесите задаток в размере 2 000 000 вон от стоимости автомобиля. Мы зарезервируем машину за вами и начнём оформление документов.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Проверка и осмотр",
      description:
        "Наш специалист проводит полный осмотр автомобиля в Южной Корее. Получите фото и видео отчёт.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Оплата остатка",
      description:
        "После подтверждения, вносите оставшуюся часть платежа. Начинаем подготовку машины к экспорту.",
    },
    {
      "@type": "HowToStep",
      position: 5,
      name: "Таможенное оформление",
      description:
        "Наша команда берёт на себя все таможенные процедуры для экспорта в Россию.",
    },
    {
      "@type": "HowToStep",
      position: 6,
      name: "Доставка в Россию",
      description:
        "Автомобиль отправляется в Россию по морю. Доставка занимает 7-14 дней.",
    },
    {
      "@type": "HowToStep",
      position: 7,
      name: "Растаможивание",
      description:
        "При прибытии в Россию помощь с растаможиванием согласно российскому законодательству.",
    },
    {
      "@type": "HowToStep",
      position: 8,
      name: "Получение автомобиля",
      description:
        "Получение машины со всеми необходимыми документами и ключами.",
    },
  ],
};

export default function HowToBuyPage() {
  return (
    <>
      <Script
        id="how-to-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Как купить автомобиль из Кореи
            </h1>
            <p className="text-lg text-gray-600">
              Полная инструкция по процессу покупки. Мы проведём вас через все 8
              этапов
            </p>
          </div>

          {/* Steps */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-orange-300 hidden md:block"></div>

            <div className="space-y-8 md:space-y-12">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className="relative md:pl-32">
                    {/* Circle indicator */}
                    <div className="absolute left-0 top-0 w-16 h-16 bg-white border-4 border-orange-500 rounded-full flex items-center justify-center md:left-0 hidden md:flex shadow-lg">
                      <Icon className="w-8 h-8 text-orange-500" />
                    </div>

                    {/* Mobile circle */}
                    <div className="md:hidden w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-md hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-3 mb-2 md:hidden">
                        <span className="text-xl font-bold text-orange-500">
                          Шаг {step.number}
                        </span>
                      </div>

                      <h2 className="text-2xl font-bold text-gray-900 mb-3 md:mb-4">
                        {step.title}
                      </h2>

                      <p className="text-gray-700 leading-relaxed mb-4">
                        {step.description}
                      </p>

                      {/* Highlight box */}
                      {step.number === 2 && (
                        <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                          <p className="text-blue-900">
                            <span className="font-bold">Важно:</span>{" "}
                            {step.highlight}
                          </p>
                        </div>
                      )}

                      {step.number === 6 && (
                        <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
                          <p className="text-amber-900">
                            <span className="font-bold">Примечание:</span>{" "}
                            {step.highlight}
                          </p>
                        </div>
                      )}

                      {step.number === 8 && (
                        <div className="mt-4 p-4 bg-green-100 border-l-4 border-green-600 rounded">
                          <p className="text-green-900 font-semibold">
                            ✅ {step.highlight}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Step number - desktop */}
                    <div className="absolute -left-24 top-6 text-xl font-bold text-orange-500 hidden lg:block">
                      Шаг {step.number}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="mt-16 p-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl text-white text-center">
            <h2 className="text-2xl font-bold mb-3">Готовы начать?</h2>
            <p className="text-orange-100 mb-6">
              Выберите автомобиль из нашего каталога и начните свой путь к
              идеальной машине
            </p>
            <a
              href="/catalog"
              className="inline-block bg-white text-orange-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Перейти в каталог
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
