"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { calcCustomsRU, calcCustomsKZ, calcCustomsUZ } from "@/utils/customsCalculator";
import type { CustomsResultRU, CustomsResultKZ, CustomsResultUZ } from "@/utils/customsCalculator";
import { trackEvent } from "@/utils/gtag";

interface Rates {
  EUR: number;
  USD: number;
  KRW: number;
  KRW_USD: number;
  UZS: number;
  KZT: number;
  EUR_KZT: number;
  source: "cbr" | "fallback";
}

type Country  = "ru" | "kz" | "uz";
type FuelType = "gasoline" | "diesel" | "hybrid" | "electric";

function fmtRUB(n: number) { return n.toLocaleString("ru-RU") + " ₽"; }
function fmtKZT(n: number) { return n.toLocaleString("ru-RU") + " ₸"; }
function fmtUZS(n: number) { return n.toLocaleString("ru-RU") + " сум"; }
function fmtUSD(n: number) { return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 }); }

const MONTHS = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];
const CUR_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 12 }, (_, i) => CUR_YEAR - i);

const TABS: { id: Country; flag: string; label: string }[] = [
  { id: "ru", flag: "🇷🇺", label: "Россия" },
  { id: "kz", flag: "🇰🇿", label: "Казахстан" },
  { id: "uz", flag: "🇺🇿", label: "Узбекистан" },
];

export default function CalculatorPage({ lang }: { lang: string }) {
  const [country, setCountry]       = useState<Country>("ru");
  const [rates, setRates]           = useState<Rates | null>(null);
  const [ratesLoading, setRatesLoading] = useState(true);

  // Form
  const [priceUSD,      setPriceUSD]      = useState("");
  const [engineVolume,  setEngineVolume]  = useState("");
  const [year,          setYear]          = useState(String(CUR_YEAR - 2));
  const [month,         setMonth]         = useState("01");
  const [fuelType,      setFuelType]      = useState<FuelType>("gasoline");
  const [horsePower,    setHorsePower]    = useState("");
  const [errors,        setErrors]        = useState<Record<string, string>>({});

  // Results
  const [resultRU, setResultRU] = useState<CustomsResultRU | null>(null);
  const [resultKZ, setResultKZ] = useState<CustomsResultKZ | null>(null);
  const [resultUZ, setResultUZ] = useState<CustomsResultUZ | null>(null);

  useEffect(() => {
    fetch("/api/exchange-rate")
      .then(r => r.json())
      .then(data => setRates(data))
      .finally(() => setRatesLoading(false));
  }, []);

  // Сброс результата при смене вкладки
  useEffect(() => {
    setResultRU(null); setResultKZ(null); setResultUZ(null);
    setErrors({});
  }, [country]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!priceUSD || isNaN(+priceUSD) || +priceUSD <= 0)
      e.priceUSD = "Введите стоимость авто";
    if (!engineVolume || isNaN(+engineVolume) || +engineVolume <= 0)
      e.engineVolume = "Введите объём двигателя";
    if (country === "ru" && fuelType !== "electric") {
      if (!horsePower || isNaN(+horsePower) || +horsePower <= 0)
        e.horsePower = "Введите мощность двигателя";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleCalculate() {
    if (!validate() || !rates) return;

    trackEvent("calculator_use", {
      country,
      fuel_type: fuelType,
      price_usd: priceUSD,
      engine_volume: engineVolume,
      year,
    });

    const price    = parseFloat(priceUSD);
    const vol      = parseInt(engineVolume);
    const yearMonth = `${year}${month.padStart(2, "0")}`;
    const fuel     = fuelType === "electric" ? "electric" : fuelType;
    const priceKRW = price / rates.KRW_USD;

    if (country === "ru") {
      const hp = fuelType !== "electric" && horsePower ? parseInt(horsePower) : undefined;
      setResultRU(calcCustomsRU({ priceKRW, yearMonth, engineVolume: vol, horsePower: hp, fuelType: fuel, eurRate: rates.EUR, krwRate: rates.KRW }));
    } else if (country === "kz") {
      setResultKZ(calcCustomsKZ({ priceKRW, yearMonth, engineVolume: vol, fuelType: fuel, usdKztRate: rates.KZT, eurKztRate: rates.EUR_KZT, krwUsdRate: rates.KRW_USD }));
    } else {
      setResultUZ(calcCustomsUZ({ priceKRW, yearMonth, engineVolume: vol, fuelType: fuel, krwUsdRate: rates.KRW_USD, uzsPerUsd: rates.UZS }));
    }
  }

  const inp = (field: string) =>
    `w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--axis-orange)]/30 focus:border-[var(--axis-orange)] bg-transparent text-white transition-colors ${
      errors[field] ? "border-red-500" : "border-white/20"
    }`;

  const lbl = "block text-xs font-medium mb-1.5 text-gray-400";

  const hasResult =
    (country === "ru" && !!resultRU) ||
    (country === "kz" && !!resultKZ) ||
    (country === "uz" && !!resultUZ);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--axis-black)" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Заголовок ── */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-3">
            🧮 Калькулятор растаможки{" "}
            <span style={{ color: "var(--axis-orange)" }}>авто из Кореи</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Актуальные ставки 2026 — Россия, Казахстан, Узбекистан. Для физических лиц.
          </p>
          {rates && (
            <p className="text-xs text-gray-600 mt-2">
              1 EUR = {rates.EUR} ₽ · 1 USD = {rates.KZT.toLocaleString("ru-RU")} ₸ · 1 USD = {rates.UZS.toLocaleString("ru-RU")} сум
              {rates.source === "fallback" && <span className="text-yellow-600 ml-2">(приблизительный)</span>}
            </p>
          )}
        </div>

        {/* ── Карточка калькулятора ── */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}>

          {/* Табы */}
          <div className="px-6 pt-5 pb-0" style={{ background: "linear-gradient(to right, var(--axis-graphite), #1a1a1a)" }}>
            <div className="flex gap-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCountry(tab.id)}
                  className="px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors"
                  style={country === tab.id
                    ? { backgroundColor: "var(--axis-orange)", color: "white" }
                    : { color: "var(--axis-gray)" }
                  }
                >
                  {tab.flag} {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Форма + Результат */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* ── ЛЕВАЯ — Поля ввода ── */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Параметры автомобиля</p>

                {/* Цена */}
                <div>
                  <label className={lbl}>Стоимость авто (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">$</span>
                    <input type="number" min="1" placeholder="25 000" value={priceUSD}
                      onChange={e => setPriceUSD(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleCalculate()}
                      className={inp("priceUSD") + " pl-7"} />
                  </div>
                  {errors.priceUSD && <p className="text-xs text-red-400 mt-1">{errors.priceUSD}</p>}
                </div>

                {/* Объём */}
                <div>
                  <label className={lbl}>Объём двигателя</label>
                  <div className="relative">
                    <input type="number" min="1" placeholder="1 600" value={engineVolume}
                      onChange={e => setEngineVolume(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleCalculate()}
                      className={inp("engineVolume") + " pr-14"} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">см³</span>
                  </div>
                  {errors.engineVolume && <p className="text-xs text-red-400 mt-1">{errors.engineVolume}</p>}
                </div>

                {/* Год + Месяц */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Год выпуска</label>
                    <select value={year} onChange={e => setYear(e.target.value)} className={inp("year")}>
                      {YEARS.map(y => (
                        <option key={y} value={y} style={{ backgroundColor: "#1a1a1a" }}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Месяц выпуска</label>
                    <select value={month} onChange={e => setMonth(e.target.value)} className={inp("month")}>
                      {MONTHS.map((m, i) => (
                        <option key={i} value={String(i + 1).padStart(2, "0")} style={{ backgroundColor: "#1a1a1a" }}>
                          {String(i + 1).padStart(2, "0")} — {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Тип топлива */}
                <div>
                  <label className={lbl}>Тип двигателя</label>
                  <select value={fuelType} onChange={e => setFuelType(e.target.value as FuelType)} className={inp("fuelType")}>
                    <option value="gasoline" style={{ backgroundColor: "#1a1a1a" }}>Бензин</option>
                    <option value="diesel"   style={{ backgroundColor: "#1a1a1a" }}>Дизель</option>
                    <option value="hybrid"   style={{ backgroundColor: "#1a1a1a" }}>Гибрид (HEV / PHEV)</option>
                    <option value="electric" style={{ backgroundColor: "#1a1a1a" }}>Электромобиль (EV)</option>
                  </select>
                </div>

                {/* Мощность — только для РФ и не электро */}
                {country === "ru" && fuelType !== "electric" && (
                  <div>
                    <label className={lbl}>Мощность двигателя</label>
                    <div className="relative">
                      <input type="number" min="1" placeholder="150" value={horsePower}
                        onChange={e => setHorsePower(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleCalculate()}
                        className={inp("horsePower") + " pr-14"} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">л.с.</span>
                    </div>
                    {errors.horsePower && <p className="text-xs text-red-400 mt-1">{errors.horsePower}</p>}
                  </div>
                )}

                {/* Кнопка */}
                <button
                  onClick={handleCalculate}
                  disabled={ratesLoading}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 mt-2"
                  style={{ backgroundColor: "var(--axis-orange)", color: "white", opacity: ratesLoading ? 0.6 : 1 }}
                >
                  {ratesLoading ? "Загрузка курсов..." : "Рассчитать →"}
                </button>

                <p className="text-xs text-gray-600 leading-relaxed">
                  💡 Расчёт ориентировочный. Доставка не включена. Актуальные ставки уточняйте у брокера.
                </p>
              </div>

              {/* ── ПРАВАЯ — Результаты ── */}
              <div>

                {/* Пустое состояние */}
                {!hasResult && (
                  <div className="h-full flex flex-col items-center justify-center text-center py-16">
                    <div className="text-5xl mb-4 opacity-30">🧮</div>
                    <p className="text-gray-600 text-sm">Заполните параметры слева<br />и нажмите «Рассчитать»</p>
                  </div>
                )}

                {/* ── РФ ── */}
                {country === "ru" && resultRU && (
                  <div className="space-y-3">
                    <div className="rounded-xl px-5 py-4" style={{ backgroundColor: "rgba(0,44,95,0.25)", border: "1px solid rgba(0,44,95,0.5)" }}>
                      <div className="text-xs text-gray-500 mb-1">Итого таможенных платежей</div>
                      <div className="text-3xl font-bold text-white">{fmtRUB(resultRU.totalRUB)}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Авто ≈ {fmtRUB(resultRU.priceRUB)} ({resultRU.priceEUR.toLocaleString("ru-RU")} €) · {resultRU.carAgeYears} {resultRU.carAgeYears < 2 ? "год" : resultRU.carAgeYears < 5 ? "года" : "лет"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      {[
                        { label: "Таможенная пошлина",   value: fmtRUB(resultRU.dutyRUB) },
                        { label: "Таможенный сбор",       value: fmtRUB(resultRU.customsFeeRUB) },
                        { label: `Утилсбор${resultRU.recyclingIsApprox ? " (прибл.)" : ""}`, value: fmtRUB(resultRU.recyclingFeeRUB) },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between text-sm py-1.5 border-b border-white/5">
                          <span className="text-gray-400">{r.label}</span>
                          <span className="text-white font-medium">{r.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl px-5 py-4" style={{ backgroundColor: "rgba(0,100,0,0.15)", border: "1px solid rgba(0,150,0,0.25)" }}>
                      <div className="text-xs text-gray-400 mb-1">Итоговая стоимость в России</div>
                      <div className="text-2xl font-bold text-green-400">{fmtRUB(resultRU.priceRUB + resultRU.totalRUB)}</div>
                      <div className="text-sm text-green-600 mt-0.5">≈ {fmtUSD(Math.round((resultRU.priceRUB + resultRU.totalRUB) / (rates!.KRW / rates!.KRW_USD)))}</div>
                    </div>
                  </div>
                )}

                {/* ── КЗ ── */}
                {country === "kz" && resultKZ && (
                  <div className="space-y-3">
                    {resultKZ.isOldCar && (
                      <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "rgba(180,0,0,0.15)", border: "1px solid rgba(180,0,0,0.3)" }}>
                        <p className="text-sm text-red-300">⚠️ Авто старше 7 лет — ввоз нецелесообразен</p>
                      </div>
                    )}
                    {resultKZ.carAgeMonths > 36 && !resultKZ.isOldCar && (
                      <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "rgba(180,130,0,0.15)", border: "1px solid rgba(180,130,0,0.3)" }}>
                        <p className="text-sm text-yellow-300">⚠️ Возраст {resultKZ.carAgeMonths} мес. — регистрация 500 МРП ({fmtKZT(resultKZ.registrationFeeKZT)})</p>
                      </div>
                    )}
                    {resultKZ.isLuxury && (
                      <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "rgba(180,80,0,0.15)", border: "1px solid rgba(180,80,0,0.3)" }}>
                        <p className="text-sm text-orange-300">💎 Акциз на роскошь +10%</p>
                      </div>
                    )}
                    <div className="rounded-xl px-5 py-4" style={{ backgroundColor: "rgba(0,44,95,0.25)", border: "1px solid rgba(0,44,95,0.5)" }}>
                      <div className="text-xs text-gray-500 mb-1">Итого таможенных платежей</div>
                      <div className="text-3xl font-bold text-white">{fmtKZT(resultKZ.totalKZT)}</div>
                      <div className="text-xs text-gray-500 mt-1">Возраст: {resultKZ.carAgeMonths} мес. · {fmtUSD(resultKZ.priceUSD)}</div>
                    </div>
                    <div className="space-y-1">
                      {[
                        { label: "Таможенный сбор (6 МРП)",         value: fmtKZT(resultKZ.customsFeeKZT) },
                        { label: "Таможенная пошлина",               value: fmtKZT(resultKZ.dutyKZT) },
                        ...(resultKZ.exciseEngineKZT > 0 ? [{ label: "Акциз (объём >3 000 см³)", value: fmtKZT(resultKZ.exciseEngineKZT) }] : []),
                        ...(resultKZ.exciseLuxuryKZT > 0 ? [{ label: "Акциз на роскошь (10%)",  value: fmtKZT(resultKZ.exciseLuxuryKZT) }] : []),
                        { label: "НДС 16%",                          value: fmtKZT(resultKZ.vatKZT) },
                        { label: "Первичная регистрация (ЦОН)",      value: fmtKZT(resultKZ.registrationFeeKZT) },
                        { label: `Утилизационный сбор${resultKZ.isElectric ? " (0 ₸ — электро)" : ""}`, value: fmtKZT(resultKZ.recyclingFeeKZT) },
                        { label: "Доп. расходы (СБКТС, брокер)",     value: "≈ " + fmtKZT(resultKZ.additionalKZT) },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between text-sm py-1.5 border-b border-white/5">
                          <span className="text-gray-400">{r.label}</span>
                          <span className="text-white font-medium">{r.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl px-5 py-4" style={{ backgroundColor: "rgba(0,100,0,0.15)", border: "1px solid rgba(0,150,0,0.25)" }}>
                      <div className="text-xs text-gray-400 mb-1">Итоговая стоимость в Казахстане</div>
                      <div className="text-2xl font-bold text-green-400">{fmtKZT(resultKZ.customsValueKZT + resultKZ.totalKZT)}</div>
                      <div className="text-sm text-green-600 mt-0.5">≈ {fmtUSD(Math.round((resultKZ.customsValueKZT + resultKZ.totalKZT) / rates!.KZT))}</div>
                    </div>
                  </div>
                )}

                {/* ── УЗ ── */}
                {country === "uz" && resultUZ && (
                  <div className="space-y-3">
                    {resultUZ.isUsedCar && (
                      <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "rgba(180,130,0,0.15)", border: "1px solid rgba(180,130,0,0.3)" }}>
                        <p className="text-sm text-yellow-300">⚠️ Авто старше 1 года — заградительные пошлины</p>
                      </div>
                    )}
                    {resultUZ.isElectric && (
                      <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "rgba(0,120,0,0.15)", border: "1px solid rgba(0,150,0,0.3)" }}>
                        <p className="text-sm text-green-300">⚡ Электромобиль: пошлина 0%, утильсбор 0 сум</p>
                      </div>
                    )}
                    <div className="rounded-xl px-5 py-4" style={{ backgroundColor: "rgba(0,44,95,0.25)", border: "1px solid rgba(0,44,95,0.5)" }}>
                      <div className="text-xs text-gray-500 mb-1">Итого таможенных платежей</div>
                      <div className="text-3xl font-bold text-white">{fmtUZS(resultUZ.totalUZS)}</div>
                      <div className="text-xs text-gray-500 mt-1">≈ {fmtUSD(resultUZ.totalUSD)} · {fmtUSD(resultUZ.priceUSD)}</div>
                    </div>
                    <div className="space-y-1">
                      {[
                        { label: "Таможенный сбор (ПКМ №700)",  value: fmtUZS(resultUZ.customsFeeUZS) },
                        { label: "Таможенная пошлина",           value: fmtUZS(resultUZ.dutyUZS) },
                        { label: "НДС 12%",                      value: fmtUZS(resultUZ.vatUZS) },
                        { label: `Утилизационный сбор${resultUZ.isElectric ? " (0 сум)" : ""}`, value: fmtUZS(resultUZ.recyclingFeeUZS) },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between text-sm py-1.5 border-b border-white/5">
                          <span className="text-gray-400">{r.label}</span>
                          <span className="text-white font-medium">{r.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl px-5 py-4" style={{ backgroundColor: "rgba(0,100,0,0.15)", border: "1px solid rgba(0,150,0,0.25)" }}>
                      <div className="text-xs text-gray-400 mb-1">Итоговая стоимость в Узбекистане</div>
                      <div className="text-2xl font-bold text-green-400">{fmtUZS(resultUZ.priceUZS + resultUZ.totalUZS)}</div>
                      <div className="text-sm text-green-600 mt-0.5">≈ {fmtUSD(resultUZ.priceUSD + resultUZ.totalUSD)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── CTA — каталог ── */}
        <div className="mt-6 rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(255,69,0,0.2)" }}>
          <div>
            <p className="font-semibold text-white">Нашли подходящую стоимость?</p>
            <p className="text-sm text-gray-400 mt-0.5">Подберём авто под ваш бюджет из каталога Encar</p>
          </div>
          <Link href={`/${lang}/catalog`}
            className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ backgroundColor: "var(--axis-orange)", color: "white" }}>
            Перейти в каталог →
          </Link>
        </div>

        {/* ── SEO-блок ── */}
        <div className="mt-14 space-y-10 text-gray-400 text-sm leading-relaxed">
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Как рассчитывается растаможка авто из Кореи в 2026 году</h2>
            <p>
              Калькулятор учитывает актуальные ставки таможенных пошлин ЕАЭС, утилизационного сбора и НДС для трёх стран.
              Расчёт производится для физических лиц при самостоятельном ввозе автомобиля.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                flag: "🇷🇺",
                title: "Россия",
                text: "Пошлина по комбинированной ставке ЕАЭС (% от стоимости + €/см³). Утилизационный сбор от 3 400 ₽ (льготная ставка для физлиц до 160 л.с.) до нескольких миллионов. Таможенный сбор — ступенчатая шкала по стоимости.",
              },
              {
                flag: "🇰🇿",
                title: "Казахстан",
                text: "Пошлина 15%. НДС 16% с 01.01.2026. Утильсбор привязан к МРП (4 325 ₸ в 2026). Первичная регистрация: от 1 081 ₸ (до 2 лет) до 2 162 500 ₸ (старше 3 лет). Электромобили: нулевой утильсбор.",
              },
              {
                flag: "🇺🇿",
                title: "Узбекистан",
                text: "С 01.01.2026 льготы на малолитражки отменены. Пошлина = 15% + фикс. доплата в USD за каждый см³. НДС 12%. Утильсбор 30–300 БРВ. Электромобили: нулевая пошлина и утильсбор.",
              },
            ].map(item => (
              <div key={item.title} className="rounded-xl p-5 space-y-2" style={{ backgroundColor: "var(--axis-charcoal)" }}>
                <h3 className="text-white font-semibold">{item.flag} {item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-5">Частые вопросы</h2>
            <div className="space-y-3">
              {[
                {
                  q: "Включена ли доставка в расчёт?",
                  a: "Нет. Стоимость доставки из Кореи до таможни рассчитывается отдельно и зависит от маршрута, веса и габаритов автомобиля. Уточняйте у менеджера.",
                },
                {
                  q: "Для каких лиц работает калькулятор?",
                  a: "Только для физических лиц. Для юридических лиц и ИП ставки существенно отличаются.",
                },
                {
                  q: "Насколько точен расчёт?",
                  a: "Расчёт ориентировочный. Итоговая сумма может незначительно отличаться из-за актуального курса валют на дату оформления и индивидуальных параметров автомобиля.",
                },
                {
                  q: "Какие авто выгоднее всего ввозить в Казахстан?",
                  a: "Новые электромобили (до 1 года): нулевой утильсбор и льготная пошлина. Новые бензиновые до 2 лет с объёмом до 2 000 см³ — оптимальное соотношение таможенной нагрузки к стоимости.",
                },
                {
                  q: "Почему в Узбекистане так дорого растаможивать ДВС?",
                  a: "С 1 января 2026 года Узбекистан отменил льготы на малолитражки. Теперь все бензиновые и дизельные авто платят 15% пошлины плюс фиксированную доплату за каждый кубический сантиметр объёма. Это делает электромобили значительно выгоднее.",
                },
              ].map((faq, i) => (
                <div key={i} className="rounded-xl p-5" style={{ backgroundColor: "var(--axis-charcoal)" }}>
                  <p className="text-white font-medium mb-2">{faq.q}</p>
                  <p>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
