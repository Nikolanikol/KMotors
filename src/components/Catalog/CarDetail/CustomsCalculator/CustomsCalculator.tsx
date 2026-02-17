"use client";

import { useEffect, useState } from "react";
import { calcCustomsRU, calcCustomsUZ } from "@/utils/customsCalculator";
import type { CustomsResultRU, CustomsResultUZ } from "@/utils/customsCalculator";

interface Props {
  priceKRW: number;
  yearMonth: string;
  engineVolume: number;
  fuelType?: string;
}

interface Rates {
  EUR: number;
  USD: number;
  KRW: number;
  KRW_USD: number;
  UZS: number;
  source: "cbr" | "fallback";
}

type Country = "ru" | "uz";

function fmtRUB(n: number) {
  return n.toLocaleString("ru-RU") + " ₽";
}
function fmtUSD(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtUZS(n: number) {
  return n.toLocaleString("ru-RU") + " сум";
}

export default function CustomsCalculator({
  priceKRW,
  yearMonth,
  engineVolume,
  fuelType,
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
      usdRate: rates.KRW_USD,
      uzsPerUsd: rates.UZS,
    });
    setResultUZ(res);
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
    { id: "uz", label: "Узбекистан", flag: "🇺🇿" },
  ];

  return (
    <div className="mt-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header с вкладками */}
      <div className="bg-gradient-to-r from-[#002C5F] to-[#003d7a] px-6 pt-4 pb-0">
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
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                country === tab.id
                  ? "bg-white text-[#002C5F]"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {tab.flag} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {loading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-48" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-4 bg-gray-200 rounded w-40" />
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
                <div className="bg-gray-50 rounded-xl px-4 py-4 space-y-3">
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
                        <span className="text-gray-600">Утилизационный сбор</span>
                        <span className="font-medium">{fmtRUB(resultRU.recyclingFeeRUB)}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 font-semibold">
                        <span>Итого</span>
                        <span className="text-[#002C5F]">{fmtRUB(resultRU.totalRUB)}</span>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4">
                      <div className="text-sm text-gray-500 mb-1">Итоговая стоимость авто в Россия</div>
                      <div className="text-2xl font-bold text-green-700">
                        {fmtUSD(Math.round((resultRU.priceRUB + resultRU.totalRUB) / rates.USD))}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Авто {fmtUSD(Math.round(resultRU.priceRUB / rates.USD))} + Таможня {fmtUSD(Math.round(resultRU.totalRUB / rates.USD))}
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 leading-relaxed">
                      ⚠️ Расчёт ориентировочный для физических лиц по ставкам ЕАЭС. Не учтены: брокерские услуги, хранение, СБКТС, ЭПТС. Актуальные ставки уточняйте у таможенного брокера.
                    </p>
                  </>
                )}
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
                    {" · "}1 KRW ≈ <strong className="text-gray-700">${(rates.KRW_USD).toFixed(5)}</strong>
                  </span>
                </div>

                {/* Предупреждение о запрете */}
                {resultUZ?.isOverLimit && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <p className="text-sm text-red-700 font-medium">
                      🚫 Возраст автомобиля превышает 7 лет — ввоз в Узбекистан для физических лиц запрещён
                    </p>
                  </div>
                )}

                {resultUZ && !resultUZ.isOverLimit && (
                  <>
                    {/* Итог */}
                    <div className="bg-blue-50 rounded-xl px-5 py-4">
                      <div className="text-sm text-gray-500 mb-1">Итого к оплате на таможне</div>
                      <div className="text-3xl font-bold text-[#002C5F]">{fmtUSD(resultUZ.totalUSD)}</div>
                      <div className="text-sm text-gray-500 mt-1 font-medium">
                        ≈ {fmtUZS(resultUZ.totalUZS)}
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
                        <span className="text-gray-600">Таможенная пошлина</span>
                        <span className="font-medium">{fmtUSD(resultUZ.dutyUSD)}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                        <span className="text-gray-600">НДС (12%)</span>
                        <span className="font-medium">{fmtUSD(resultUZ.vatUSD)}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                        <span className="text-gray-600">Утилизационный сбор</span>
                        <span className="font-medium">{fmtUSD(resultUZ.recyclingFeeUSD)}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                        <span className="text-gray-600">Таможенный сбор</span>
                        <span className="font-medium">{fmtUSD(resultUZ.customsFeeUSD)}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 font-semibold">
                        <span>Итого</span>
                        <span className="text-[#002C5F]">{fmtUSD(resultUZ.totalUSD)}</span>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4">
                      <div className="text-sm text-gray-500 mb-1">Итоговая стоимость авто в Узбекистане</div>
                      <div className="text-2xl font-bold text-green-700">
                        {fmtUSD(Math.round(resultUZ.priceUSD + resultUZ.totalUSD))}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Авто {fmtUSD(Math.round(resultUZ.priceUSD))} + Таможня {fmtUSD(Math.round(resultUZ.totalUSD))}
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 leading-relaxed">
                      ⚠️ Расчёт ориентировочный для физических лиц. Максимальный возраст авто — 7 лет, не ниже Euro-5. Не учтены: брокерские услуги, доставка, регистрация. Уточняйте у таможенного брокера.
                    </p>
                  </>
                )}

                {/* Подсказка */}
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
