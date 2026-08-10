import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import CustomsDictionary from "@/components/I18nProvider/CustomsDictionary";
import CountryTabs from "@/components/Customs/CountryTabs";

/**
 * Шрифты подключены здесь, а не в корневом layout: на остальных страницах
 * сайта эти два семейства не нужны, и грузить их всем — регресс по весу.
 *
 * Space Grotesk не содержит кириллицы, поэтому русские заголовки падают на
 * Inter — ровно как в исходном калькуляторе. Латиница (SAKARTVELO / CUSTOMS
 * ESTIMATE) рисуется им.
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
 * Layout сегмента страны.
 *
 * Лежит на уровне `[country]`, а не `calculator`, по двум причинам: он не
 * задевает страницу-хаб `/calculator`, и при переходе между странами Next
 * его не перемонтирует — благодаря этому плашка табов не мигает, а введённые
 * параметры авто переживают переключение (см. CalcParamsProvider).
 */
export default async function CountryLayout({
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
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
