import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import CustomsDictionary from "@/components/I18nProvider/CustomsDictionary";
import CountryTabs from "@/components/Customs/CountryTabs";
import { CalcParamsProvider } from "@/components/Customs/CalcParams";

/**
 * Шрифты подключены здесь, а не в корневом layout: на остальных страницах
 * сайта эти два семейства не нужны, и грузить их всем — регресс по весу.
 *
 * Space Grotesk не содержит кириллицы, поэтому русские заголовки падают на
 * Inter. Латиница (ROSSIYA / CUSTOMS ESTIMATE) рисуется им.
 */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

/**
 * Общая обвязка калькулятора: одна плашка табов на все семь направлений.
 *
 * Лежит на СТАТИЧЕСКОМ сегменте `calculator`, а не внутри `[country]`, и это
 * принципиально. Layout внутри динамического сегмента перемонтируется при
 * смене параметра — Next держит разные значения разными узлами кэша, — и
 * введённые параметры авто обнулялись бы на каждом переключении таба.
 * Проверено маркером монтирования.
 *
 * Отсюда же следует, что обвязка одинаково накрывает и `/calculator`
 * (страна по умолчанию), и `/calculator/[country]`.
 */
export default async function CalculatorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <div
      className={`calc-surface ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      {/* Словарь регистрируется до потребителей: соседи рендерятся по порядку. */}
      <CustomsDictionary lang={lang} />

      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
        <CountryTabs lang={lang} />
        <div className="mt-6">
          <CalcParamsProvider>{children}</CalcParamsProvider>
        </div>
      </div>
    </div>
  );
}
