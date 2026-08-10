import { notFound } from "next/navigation";
import CalculatorPanel from "@/components/Customs/CalculatorPanel";
import { COUNTRIES, type CountryId } from "@/lib/customs/core/registry";
import { getRates } from "@/lib/customs/fx/getRates";

/**
 * Курс запекается в HTML в момент рендера, поэтому маршрут обязан
 * перерендериваться не реже, чем живёт кэш курса: правило проекта —
 * revalidate не выше 86400 на любом маршруте, который рендерит цену.
 * Шесть часов совпадают с TTL запросов к провайдерам в слое fx.
 */
export const revalidate = 21600;

interface Props {
  params: Promise<{ lang: string; country: string }>;
}

function isKnownCountry(value: string): value is CountryId {
  return COUNTRIES.some((country) => country.id === value);
}

export default async function CountryCalculatorPage({ params }: Props) {
  const { country } = await params;
  if (!isKnownCountry(country)) notFound();

  // Курсы получает серверный слой: нет CORS-сюрпризов, лимиты провайдеров под
  // контролем, и значения попадают в HTML первого ответа, а не подгружаются
  // после гидратации.
  const rates = await getRates();

  return <CalculatorPanel countryId={country} rates={rates} />;
}
