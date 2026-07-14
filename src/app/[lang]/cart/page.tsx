import type { Metadata } from "next";
import { getCurrencyRates } from "@/utils/getCurrencyRates";
import { CartClient } from "./CartClient";

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
  return <CartClient lang={lang} krwToUsd={krwToUsd} />;
}
