"use client";

import { useEffect, useState } from "react";
import { calcCustomsRU, calcCustomsUZ, calcCustomsKZ } from "@/utils/customsCalculator";
import type { CustomsResultRU, CustomsResultUZ, CustomsResultKZ } from "@/utils/customsCalculator";
import CarRequestForm from "../CarRequestForm";

interface Props {
  priceKRW: number;
  yearMonth: string;
  engineVolume: number;
  fuelType?: string;
  carId?: string;
  carName?: string;
}

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

type Country = "ru" | "kz" | "uz";

function fmtRUB(n: number) {
  return n.toLocaleString("ru-RU") + " ₽";
}
function fmtUSD(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtUZS(n: number) {
  return n.toLocaleString("ru-RU") + " сум";
}
function fmtKZT(n: number) {
  return n.toLocaleString("ru-RU") + " ₸";
}

export default function CustomsCalculator({
  priceKRW,
  yearMonth,
  engineVolume,
  fuelType,
  carId,
  carName,
}: Props) {
  const [country, setCountry] = useState<Country>("ru");
  const [rates, setRates] = useState<Rates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // RU state
  const [horsePower, setHorsePower] = useState<string>("");
  const [hpError, setHpError] = useState(false);
  const [resultRU, setResultRU] = useState<CustomsResultRU | null>(null);

  // UZ state
  const [resultUZ, setResultUZ] = useState<CustomsResultUZ | null>(null);

  // KZ state
  const [resultKZ, setResultKZ] = useState<CustomsResultKZ | null>(null);

  useEffect(() => {
    fetch("/api/exchange-rate")
      .then((r) => r.json())
      .then((data: Rates) => setRates(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // Автоматический расчёт UZ при смене вкладки или загрузке курсов
  useEffect(() => {
    if (!rates || country !== "uz") return;
    const res = calcCustomsUZ({
      priceKRW,
      yearMonth,
      engineVolume,
      fuelType,
      krwUsdRate: rates.KRW_USD,
      uzsPerUsd: rates.UZS,
    });
    setResultUZ(res);
  }, [rates, country, priceKRW, yearMonth, engineVolume, fuelType]);

  // Автоматический расчёт KZ при смене вкладки или загрузке курсов
  useEffect(() => {
    if (!rates || country !== "kz") return;
    const res = calcCustomsKZ({
      priceKRW,
      yearMonth,
      engineVolume,
      fuelType,
      usdKztRate: rates.KZT,
      eurKztRate: rates.EUR_KZT,
      krwUsdRate: rates.KRW_USD,
    });
    setResultKZ(res);
  }, [rates, country, priceKRW, yearMonth, engineVolume, fuelType]);

  function handleCalculateRU() {
    const hp = parseInt(horsePower, 10);
    if (!horsePower || isNaN(hp) || hp <= 0) {
      setHpError(true);
      return;
    }
    setHpError(false);
    if (!rates) return;
    const res = calcCustomsRU({
      priceKRW,
      yearMonth,
      engineVolume,
      horsePower: hp,
      fuelType,
      eurRate: rates.EUR,
      krwRate: rates.KRW,
    });
    setResultRU(res);
  }

  const tabs: { id: Country; label: string; flag: string }[] = [
    { id: "ru", label: "Россия", flag: "🇷🇺" },
    { id: "kz", label: "Казахстан", flag: "🇰🇿" },
    { id: "uz", label: "Узбекистан", flag: "🇺🇿" },
  ];

  return (
    <div className="mt-0 rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}>
      {/* Header с вкладками */}
      <div className="px-6 pt-4 pb-0" style={{ background: "linear-gradient(to right, var(--axis-graphite), #1a1a1a)" }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-white text-lg font-semibold">🧮 Калькулятор растаможки</h3>
            <p className="text-white/70 text-sm mt-0.5">Для физических лиц</p>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCountry(tab.id)}
              className="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors"
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

      <div className="p-6">
        {loading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 w-48 rounded" style={{ backgroundColor: "var(--axis-graphite)" }} />
            <div className="h-10 rounded" style={{ backgroundColor: "var(--axis-graphite)" }} />
            <div className="h-4 w-32 rounded" style={{ backgroundColor: "var(--axis-graphite)" }} />
            <div className="h-4 w-40 rounded" style={{ backgroundColor: "var(--axis-graphite)" }} />
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm">
            Не удалось загрузить курсы валют. Попробуйте обновить страницу.
          </p>
        )}

        {!loading && !error && rates && (
          <>
            {/* ===== РОССИЯ ===== */}
            {country === "ru" && (
              <div className="space-y-5">
                {/* Курс ЦБ */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${rates.source === "cbr" ? "bg-green-500" : "bg-yellow-500"}`} />
                  {rates.source === "cbr" ? (
                    <span>
                      Курс ЦБ РФ: 1 EUR = <strong className="text-gray-700">{rates.EUR} ₽</strong>
                      {" · "}1 KRW = <strong className="text-gray-700">{rates.KRW} ₽</strong>
                    </span>
                  ) : (
                    <span className="text-yellow-600">Приблизительный курс (ЦБ РФ недоступен): 1 EUR ≈ {rates.EUR} ₽</span>
                  )}
                </div>

                {/* Форма ввода л.с. */}
                <div className="rounded-xl px-4 py-4 space-y-3" style={{ backgroundColor: "var(--axis-graphite)" }}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Мощность двигателя (л.с.)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="2000"
                        placeholder="например: 150"
                        value={horsePower}
                        onChange={(e) => { setHorsePower(e.target.value); setHpError(false); }}
                        onKeyDown={(e) => e.key === "Enter" && handleCalculateRU()}
                        className={`w-40 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002C5F]/30 focus:border-[#002C5F] ${hpError ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                      />
                      <button
                        onClick={handleCalculateRU}
                        className="px-4 py-2 bg-[#002C5F] text-white text-sm font-medium rounded-lg hover:bg-[#003d7a] transition-colors"
                      >
                        Посчитать
                      </button>
                    </div>
                    {hpError && <p className="text-xs text-red-500 mt-1.5">Введите мощность двигателя в л.с.</p>}
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    💡 Дату производства и мощность двигателя уточняйте у продавца или на индивидуальном просчёте — от этих данных зависит итоговая сумма
                  </p>
                </div>

                {resultRU && (
                  <>
                    <div className="bg-blue-50 rounded-xl px-5 py-4">
                      <div className="text-sm text-gray-500 mb-1">Итого к оплате на таможне</div>
                      <div className="text-3xl font-bold text-[#002C5F]">{fmtRUB(resultRU.totalRUB)}</div>
                      <div className="text-sm text-gray-400 mt-1">
                        Цена авто ≈ {fmtRUB(resultRU.priceRUB)} ({resultRU.priceEUR.toLocaleString("ru-RU")} €)
                        {" · "}Возраст: {resultRU.carAgeYears}{" "}
                        {resultRU.carAgeYears === 1 ? "год" : resultRU.carAgeYears < 5 ? "года" : "лет"}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-600 mb-2">Расшифровка:</div>
                      <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                        <span className="text-gray-600">Таможенная пошлина</span>
                        <span className="font-medium">{fmtRUB(resultRU.dutyRUB)}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                        <span className="text-gray-600">Таможенный сбор</span>
                        <span className="font-medium">{fmtRUB(resultRU.customsFeeRUB)}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                        <div>
                          <span className="text-gray-600">Утилизационный сбор</span>
                          {parseInt(horsePower) > 160 && (
                            <div className="text-xs text-orange-500 mt-0.5">
                              {horsePower} л.с. &gt; 160 — коммерческая ставка
                            </div>
                          )}
                        </div>
                        <span className="font-medium">{fmtRUB(resultRU.recyclingFeeRUB)}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 font-semibold">
                        <span>Итого</span>
                        <span className="text-[#002C5F]">{fmtRUB(resultRU.totalRUB)}</span>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4">
                      <div className="text-sm text-gray-500 mb-1">Итоговая стоимость авто в России</div>
                      <div className="text-2xl font-bold text-green-700">
                        {fmtRUB(resultRU.priceRUB + resultRU.totalRUB)}
                      </div>
                      <div className="text-sm text-green-600 font-medium mt-0.5">
                        ≈ {fmtUSD(Math.round((resultRU.priceRUB + resultRU.totalRUB) / (rates.KRW / rates.KRW_USD)))}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Авто {fmtRUB(resultRU.priceRUB)} + Таможня {fmtRUB(resultRU.totalRUB)}
                      </div>
                    </div>

                    <div className="text-xs text-blue-400 font-medium">
                      🚢 Доставка не включена в расчёт — обсуждается отдельно
                    </div>

                    <p className="text-xs rounded-lg p-3 leading-relaxed" style={{ color: "var(--axis-gray)", backgroundColor: "var(--axis-graphite)" }}>
                      ⚠️ Расчёт ориентировочный для физических лиц по ставкам ЕАЭС. Не учтены: брокерские услуги, хранение, СБКТС, ЭПТС. Актуальные ставки уточняйте у таможенного брокера.
                    </p>

                    {/* Шаг 6: CTA после результата RU */}
                    {carId && carName && (
                      <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <p className="text-sm font-semibold text-blue-900 mb-2">
                          Хотите точный расчёт с учётом доставки и брокерских услуг?
                        </p>
                        <CarRequestForm
                          carId={carId}
                          carName={carName}
                          source="car_calculator"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ===== КАЗАХСТАН ===== */}
            {country === "kz" && (
              <div className="space-y-5">
                {/* Курс */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${rates.source === "cbr" ? "bg-green-500" : "bg-yellow-500"}`} />
                  <span>
                    1 USD = <strong className="text-gray-700">{rates.KZT.toLocaleString("ru-RU")} ₸</strong>
                    {" · "}1 EUR ≈ <strong className="text-gray-700">{rates.EUR_KZT.toLocaleString("ru-RU")} ₸</strong>
                    {rates.source === "fallback" && (
                      <span className="text-yellow-600 ml-1">(приблизительный)</span>
                    )}
                  </span>
                </div>

                {resultKZ && (
                  <>
                    {/* Предупреждение: авто > 7 лет */}
                    {resultKZ.isOldCar && (
                      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        <p className="text-sm text-red-700 font-medium">
                          ⚠️ Автомобиль старше 7 лет — пошлина по минимальной специфической ставке (€/см³), ввоз нецелесообразен
                        </p>
                      </div>
                    )}

                    {/* Предупреждение: регистрация >36 месяцев дорогая */}
                    {!resultKZ.isOldCar && resultKZ.carAgeMonths > 36 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                        <p className="text-sm text-yellow-800">
                          ⚠️ Возраст авто {resultKZ.carAgeMonths} мес. — сбор за первичную регистрацию 500 МРП ({fmtKZT(resultKZ.registrationFeeKZT)})
                        </p>
                      </div>
                    )}

                    {/* Предупреждение: акциз роскошь */}
                    {resultKZ.isLuxury && (
                      <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                        <p className="text-sm text-orange-800">
                          💎 Таможенная стоимость превышает 18 000 МРП ({fmtKZT(77_850_000)}) — применяется акциз на роскошь +10%
                        </p>
                      </div>
                    )}

                    {/* Итог */}
                    <div className="bg-blue-50 rounded-xl px-5 py-4">
                      <div className="text-sm text-gray-500 mb-1">Итого к оплате на таможне</div>
                      <div className="text-3xl font-bold text-[#002C5F]">{fmtKZT(resultKZ.totalKZT)}</div>
                      <div className="text-sm text-gray-400 mt-1">
                        Цена авто ≈ {fmtUSD(resultKZ.priceUSD)}
                        {" · "}Возраст: {resultKZ.carAgeMonths} мес.
                      </div>
                    </div>

                    {/* Расшифровка */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-600 mb-2">Расшифровка:</div>
                      <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                        <span className="text-gray-600">Таможенная стоимость</span>
                        <span className="font-medium text-gray-500">{fmtKZT(resultKZ.customsValueKZT)}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                        <span className="text-gray-600">Таможенный сбор (6 МРП)</span>
                        <span className="font-medium">{fmtKZT(resultKZ.customsFeeKZT)}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                        <span className="text-gray-600">
                          Таможенная пошлина
                          {resultKZ.isElectric && <span className="text-green-600 ml-1">(0% — электро)</span>}
                        </span>
                        <span className="font-medium">{fmtKZT(resultKZ.dutyKZT)}</span>
                      </div>
                      {resultKZ.exciseEngineKZT > 0 && (
                        <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                          <span className="text-gray-600">Акциз (объём &gt;3 000 см³)</span>
                          <span className="font-medium">{fmtKZT(resultKZ.exciseEngineKZT)}</span>
                        </div>
                      )}
                      {resultKZ.exciseLuxuryKZT > 0 && (
                        <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                          <span className="text-gray-600">Акциз на роскошь (10%)</span>
                          <span className="font-medium">{fmtKZT(resultKZ.exciseLuxuryKZT)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                        <span className="text-gray-600">НДС 16%</span>
                        <span className="font-medium">{fmtKZT(resultKZ.vatKZT)}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                        <span className="text-gray-600">
                          Первичная регистрация (ЦОН)
                        </span>
                        <span className="font-medium">{fmtKZT(resultKZ.registrationFeeKZT)}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                        <span className="text-gray-600">
                          Утилизационный сбор
                          {resultKZ.isElectric && <span className="text-green-600 ml-1">(0 ₸ — электро)</span>}
                        </span>
                        <span className="font-medium">{fmtKZT(resultKZ.recyclingFeeKZT)}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                        <span className="text-gray-600">Доп. расходы (СБКТС, ЭВАК, брокер, СВХ)</span>
                        <span className="font-medium">≈ {fmtKZT(resultKZ.additionalKZT)}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 font-semibold">
                        <span>Итого</span>
                        <span className="text-[#002C5F]">{fmtKZT(resultKZ.totalKZT)}</span>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4">
                      <div className="text-sm text-gray-500 mb-1">Итоговая стоимость авто в Казахстане</div>
                      <div className="text-2xl font-bold text-green-700">
                        {fmtKZT(resultKZ.customsValueKZT + resultKZ.totalKZT)}
                      </div>
                      <div className="text-sm text-green-600 font-medium mt-0.5">
                        ≈ {fmtUSD(Math.round((resultKZ.customsValueKZT + resultKZ.totalKZT) / rates.KZT))}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Авто {fmtKZT(resultKZ.customsValueKZT)} + Таможня {fmtKZT(resultKZ.totalKZT)}
                      </div>
                    </div>

                    <div className="text-xs text-blue-400 font-medium">
                      🚢 Доставка не включена в расчёт — обсуждается отдельно
                    </div>

                    <p className="text-xs rounded-lg p-3 leading-relaxed" style={{ color: "var(--axis-gray)", backgroundColor: "var(--axis-graphite)" }}>
                      ⚠️ Расчёт ориентировочный для физических лиц. Ставки МРП 2026, НДС 16% (новый НК РК с 01.01.2026). Доп. расходы (~400 000 ₸) — оценочные. Актуальные ставки уточняйте у таможенного брокера.
                    </p>

                    {/* CTA */}
                    {carId && carName && (
                      <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <p className="text-sm font-semibold text-blue-900 mb-2">
                          Хотите точный расчёт с учётом доставки и брокерских услуг?
                        </p>
                        <CarRequestForm
                          carId={carId}
                          carName={carName}
                          source="car_calculator"
                        />
                      </div>
                    )}
                  </>
                )}

                <p className="text-xs text-gray-400 leading-relaxed">
                  💡 Дату производства уточняйте у продавца или на индивидуальном просчёте — от этих данных зависит итоговая сумма
                </p>
              </div>
            )}

            {/* ===== УЗБЕКИСТАН ===== */}
            {country === "uz" && (
              <div className="space-y-5">
                {/* Курс */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${rates.source === "cbr" ? "bg-green-500" : "bg-yellow-500"}`} />
                  <span>
                    1 USD = <strong className="text-gray-700">{rates.UZS.toLocaleString("ru-RU")} сум</strong>
                    {" · "}1 KRW ≈ <strong className="text-gray-700">${rates.KRW_USD.toFixed(5)}</strong>
                  </span>
                </div>

                {/* Предупреждение: авто > 1 года */}
                {resultUZ?.isUsedCar && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                    <p className="text-sm text-yellow-800 font-medium">
                      ⚠️ Автомобиль старше 1 года — в Узбекистане применяются заградительные пошлины, ввоз нецелесообразен
                    </p>
                  </div>
                )}

                {/* Бонус для электро */}
                {resultUZ?.isElectric && (
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <p className="text-sm text-green-700">
                      ⚡ Электромобиль: пошлина 0%, утилизационный сбор 0 сум
                    </p>
                  </div>
                )}

                {resultUZ && (
                  <>
                    {/* Итог */}
                    <div className="bg-blue-50 rounded-xl px-5 py-4">
                      <div className="text-sm text-gray-500 mb-1">Итого к оплате на таможне</div>
                      <div className="text-3xl font-bold text-[#002C5F]">{fmtUZS(resultUZ.totalUZS)}</div>
                      <div className="text-sm text-gray-500 mt-1 font-medium">
                        ≈ {fmtUSD(resultUZ.totalUSD)}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        Цена авто ≈ {fmtUSD(resultUZ.priceUSD)}
                        {" · "}Возраст: {resultUZ.carAgeYears}{" "}
                        {resultUZ.carAgeYears === 1 ? "год" : resultUZ.carAgeYears < 5 ? "года" : "лет"}
                      </div>
                    </div>

                    {/* Расшифровка */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-600 mb-2">Расшифровка:</div>
                      <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                        <span className="text-gray-600">Таможенная стоимость</span>
                        <span className="font-medium text-gray-500">{fmtUZS(resultUZ.priceUZS)}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                        <span className="text-gray-600">Таможенный сбор (ПКМ №700)</span>
                        <span className="font-medium">{fmtUZS(resultUZ.customsFeeUZS)}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                        <span className="text-gray-600">
                          Таможенная пошлина
                          {resultUZ.isElectric && <span className="text-green-600 ml-1">(0% — электро)</span>}
                        </span>
                        <span className="font-medium">{fmtUZS(resultUZ.dutyUZS)}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                        <span className="text-gray-600">НДС 12%</span>
                        <span className="font-medium">{fmtUZS(resultUZ.vatUZS)}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                        <span className="text-gray-600">
                          Утилизационный сбор
                          {resultUZ.isElectric && <span className="text-green-600 ml-1">(0 сум — электро)</span>}
                        </span>
                        <span className="font-medium">{fmtUZS(resultUZ.recyclingFeeUZS)}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 font-semibold">
                        <span>Итого</span>
                        <span className="text-[#002C5F]">{fmtUZS(resultUZ.totalUZS)}</span>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4">
                      <div className="text-sm text-gray-500 mb-1">Итоговая стоимость авто в Узбекистане</div>
                      <div className="text-2xl font-bold text-green-700">
                        {fmtUZS(resultUZ.priceUZS + resultUZ.totalUZS)}
                      </div>
                      <div className="text-sm text-green-600 font-medium mt-0.5">
                        ≈ {fmtUSD(resultUZ.priceUSD + resultUZ.totalUSD)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Авто {fmtUZS(resultUZ.priceUZS)} + Таможня {fmtUZS(resultUZ.totalUZS)}
                      </div>
                    </div>

                    <div className="text-xs text-blue-400 font-medium">
                      🚢 Доставка не включена в расчёт — обсуждается отдельно
                    </div>

                    <p className="text-xs rounded-lg p-3 leading-relaxed" style={{ color: "var(--axis-gray)", backgroundColor: "var(--axis-graphite)" }}>
                      ⚠️ Расчёт ориентировочный для физических лиц. Авто до 1 года, не ниже Euro-5, левый руль. С 01.01.2026 льготы на малолитражки отменены. Уточняйте у таможенного брокера.
                    </p>

                    {carId && carName && (
                      <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <p className="text-sm font-semibold text-blue-900 mb-2">
                          Хотите точный расчёт с учётом доставки и брокерских услуг?
                        </p>
                        <CarRequestForm
                          carId={carId}
                          carName={carName}
                          source="car_calculator"
                        />
                      </div>
                    )}
                  </>
                )}

                <p className="text-xs text-gray-400 leading-relaxed">
                  💡 Дату производства уточняйте у продавца или на индивидуальном просчёте — от этих данных зависит итоговая сумма
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
