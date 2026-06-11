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
  KZT: 505,   // сколько KZT за 1 USD (приблизительный курс)
};

/** Курс USD/KZT от бесплатного CDN-провайдера (fawazahmed currency API) */
async function fetchKZTRate(): Promise<number> {
  try {
    const res = await fetch(
      "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`Currency API error: ${res.status}`);
    const data = await res.json();
    const kzt = Number(data?.usd?.kzt);
    if (!kzt || isNaN(kzt) || kzt <= 0) throw new Error("Invalid KZT rate");
    return Math.round(kzt * 100) / 100;
  } catch {
    return FALLBACK_RATES.KZT;
  }
}

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
    const [cbrRes, uzsPerUsd, kztPerUsd] = await Promise.all([
      fetch("https://www.cbr-xml-daily.ru/daily_json.js", {
        next: { revalidate: 3600 }, // кешируем на 1 час
      }),
      fetchUZSRate(),
      fetchKZTRate(),
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
      : usd / 1515; // fallback через USD если KRW нет (June 2026)

    // KRW/USD: сколько USD за 1 KRW
    const krwPerUsd = krw / usd;

    // EUR/KZT: производный курс через USD
    const eurKzt = Math.round(kztPerUsd * (eur / usd) * 100) / 100;

    return NextResponse.json({
      EUR: Math.round(eur * 100) / 100,
      USD: Math.round(usd * 100) / 100,
      KRW: Math.round(krw * 10000) / 10000,
      KRW_USD: Math.round(krwPerUsd * 100000) / 100000, // KRW → USD коэффициент
      UZS: Math.round(uzsPerUsd), // сколько UZS за 1 USD
      KZT: kztPerUsd,             // сколько KZT за 1 USD
      EUR_KZT: eurKzt,            // сколько KZT за 1 EUR
      source: "cbr",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Exchange rate fetch error:", error);

    const uzsPerUsd = await fetchUZSRate();

    // Возвращаем fallback с пометкой
    const fallbackEurKzt = Math.round(FALLBACK_RATES.KZT * (FALLBACK_RATES.EUR / FALLBACK_RATES.USD) * 100) / 100;

    return NextResponse.json({
      ...FALLBACK_RATES,
      KRW_USD: FALLBACK_RATES.KRW / FALLBACK_RATES.USD,
      UZS: uzsPerUsd,
      EUR_KZT: fallbackEurKzt,
      source: "fallback",
      updatedAt: new Date().toISOString(),
    });
  }
}
