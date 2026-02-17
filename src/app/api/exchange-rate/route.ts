import { NextResponse } from "next/server";

interface CBRRate {
  Value: number;
  Nominal: number;
}

interface CBRResponse {
  Valute: {
    EUR: CBRRate;
    USD: CBRRate;
    KRW: CBRRate;
    [key: string]: CBRRate;
  };
}

interface CBURate {
  Ccy: string;
  Rate: string;
}

// Дефолтные курсы на случай недоступности API
const FALLBACK_RATES = {
  EUR: 95,
  USD: 88,
  KRW: 0.065,
  UZS: 12700, // сколько UZS за 1 USD
};

async function fetchUZSRate(): Promise<number> {
  try {
    const res = await fetch("https://cbu.uz/uz/arkhiv-kursov-valyut/json/", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`CBU API error: ${res.status}`);
    const data: CBURate[] = await res.json();
    const usdEntry = data.find((r) => r.Ccy === "USD");
    if (!usdEntry) throw new Error("USD not found in CBU response");
    const rate = parseFloat(usdEntry.Rate);
    if (isNaN(rate) || rate <= 0) throw new Error("Invalid UZS rate");
    return rate;
  } catch {
    return FALLBACK_RATES.UZS;
  }
}

export async function GET() {
  try {
    const [cbrRes, uzsPerUsd] = await Promise.all([
      fetch("https://www.cbr-xml-daily.ru/daily_json.js", {
        next: { revalidate: 3600 }, // кешируем на 1 час
      }),
      fetchUZSRate(),
    ]);

    if (!cbrRes.ok) {
      throw new Error(`CBR API error: ${cbrRes.status}`);
    }

    const data: CBRResponse = await cbrRes.json();

    const eur = data.Valute.EUR.Value / data.Valute.EUR.Nominal;
    const usd = data.Valute.USD.Value / data.Valute.USD.Nominal;
    // KRW у ЦБ РФ — номинал 100 вон, поэтому делим
    const krw = data.Valute.KRW
      ? data.Valute.KRW.Value / data.Valute.KRW.Nominal
      : usd / 1350; // fallback через USD если KRW нет

    // KRW/USD: сколько USD за 1 KRW
    const krwPerUsd = krw / usd;

    return NextResponse.json({
      EUR: Math.round(eur * 100) / 100,
      USD: Math.round(usd * 100) / 100,
      KRW: Math.round(krw * 10000) / 10000,
      KRW_USD: Math.round(krwPerUsd * 100000) / 100000, // KRW → USD коэффициент
      UZS: Math.round(uzsPerUsd), // сколько UZS за 1 USD
      source: "cbr",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Exchange rate fetch error:", error);

    const uzsPerUsd = await fetchUZSRate();

    // Возвращаем fallback с пометкой
    return NextResponse.json({
      ...FALLBACK_RATES,
      KRW_USD: FALLBACK_RATES.KRW / FALLBACK_RATES.USD,
      UZS: uzsPerUsd,
      source: "fallback",
      updatedAt: new Date().toISOString(),
    });
  }
}
