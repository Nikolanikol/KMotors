import CarsDictionary from "@/components/I18nProvider/CarsDictionary";
import CompareClient from "./CompareClient";

export default async function ComparePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <>
      {/* CompareClient переводит характеристики через словарь Encar */}
      <CarsDictionary lang={lang} />
      <CompareClient />
    </>
  );
}
