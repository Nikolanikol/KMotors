import type { Metadata } from "next";
import { getCurrencyRates } from "@/utils/getCurrencyRates";
import { CartClient } from "./CartClient";
import SectionDictionary from "@/components/I18nProvider/SectionDictionary";

export const metadata: Metadata = {
  title: "Корзина — KMotors",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function CartPage({ params }: Props) {
  const { lang } = await params;
  const { krwToUsd } = await getCurrencyRates();
  return (
    <>
      <SectionDictionary lang={lang} sections={["parts"]} />
      <CartClient lang={lang} krwToUsd={krwToUsd} />
    </>
  );
}
