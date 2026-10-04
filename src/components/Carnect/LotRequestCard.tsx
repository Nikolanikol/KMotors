"use client";

// Плашка заявки под ценой на странице машины carnect.
//
// Оформление и форма — те же, что у карточки Encar (`CarDetailSidebar`:
// «Хочу эту машину», пульсирующая точка, `CarRequestForm`, уходит в Telegram
// через /api/telegram). Отличие — выбор цели: машина с аукциона покупается не
// так, как с Encar, и менеджеру важно сразу знать, зачем пришёл клиент —
// торговаться за лот, посчитать под ключ или проверить до торгов. Цель уходит
// в заявку «Комментарием» вместе с площадкой, номером лота и датой торгов.
//
// Подписи — парами [ru, en], а не через i18next: под /admin инстанса нет
// (lang.ts). Язык клиента — у подписей и у текста WhatsApp, который клиент
// отправляет сам. Заявка в Telegram читается менеджером и уходит ВСЕГДА
// по-русски: цель (`tg`) и строка лота (`lotRefRu`) для неё отдельные.
//
// ⚠️ В текст WhatsApp идёт НАШ адрес страницы (`pageUrl`), а не carnect:
// правило lotAskText в src/lib/contact.ts — ссылка на посредника уводит сделку.

import { useState } from "react";

import CarRequestForm from "@/components/Catalog/CarDetail/CarRequestForm";
import { waHref } from "@/lib/contact";
import { pick, type CardLang, type Pair } from "@/lib/carnect/lang";

const FORM = {
  successModal: ["Заявка отправлена", "Request sent"],
  subtitle: ["Менеджер свяжется с вами в ближайшее время", "A manager will contact you shortly"],
  yourName: ["Ваше имя", "Your name"],
  phone: ["Телефон", "Phone"],
  messengerLabel: ["Как с вами связаться?", "How should we contact you?"],
  tgUsernamePlaceholder: ["@ваш_username в Telegram", "@your_username on Telegram"],
  submitting: ["Отправка…", "Sending…"],
  submit: ["Отправить заявку", "Send request"],
  errorSend: ["Не отправилось, попробуйте ещё раз", "Could not send, please try again"],
} satisfies Record<string, Pair>;

const UI = {
  want: ["Хочу эту машину", "I want this car"],
  within: ["Менеджер свяжется в течение часа", "A manager will reply within an hour"],
  need: ["Что нужно", "What do you need"],
  whatsapp: ["Написать в WhatsApp", "Message on WhatsApp"],
} satisfies Record<string, Pair>;

/** Цель обращения: подпись кнопки, текст клиента (WhatsApp) и, всегда по-русски, текст менеджеру. */
interface Goal {
  id: string;
  label: Pair;
  text: Pair;
}

function goalsOf(fixedPrice: boolean): Goal[] {
  return [
    fixedPrice
      ? { id: "buy", label: ["Выкупить", "Buy now"], text: ["Хочу выкупить по фиксированной цене", "I want to buy at the fixed price"] }
      : {
          id: "bid",
          label: ["Участвовать в торгах", "Bid on this lot"],
          text: ["Хочу участвовать в торгах за этот лот", "I want to bid on this lot"],
        },
    {
      id: "turnkey",
      label: ["Цена под ключ", "Delivered price"],
      text: ["Посчитайте цену под ключ с доставкой и растаможкой", "Please quote a delivered price incl. shipping and customs"],
    },
    {
      id: "check",
      label: fixedPrice ? ["Проверить машину", "Inspect the car"] : ["Проверить до торгов", "Inspect before auction"],
      text: ["Проверьте машину перед покупкой", "Please inspect the car before purchase"],
    },
    { id: "ask", label: ["Задать вопрос", "Ask a question"], text: ["Есть вопрос по машине", "I have a question about this car"] },
  ];
}

export default function LotRequestCard({
  carId,
  carName,
  lotRef,
  lotRefRu,
  fixedPrice,
  lang,
  pageUrl,
}: {
  carId: string;
  carName: string;
  /** «K Car · Sejong, lot 1234, auction 2026-10-06» — на языке клиента, для WhatsApp. */
  lotRef: string;
  /** То же по-русски — в заявку менеджеру. */
  lotRefRu: string;
  /** HeyDealer Instant: торгов нет, машину выкупают по цене. */
  fixedPrice: boolean;
  lang: CardLang;
  /** НАШ адрес страницы машины. */
  pageUrl?: string;
}) {
  const goals = goalsOf(fixedPrice);
  const [goal, setGoal] = useState(goals[0].id);
  const picked = goals.find((g) => g.id === goal) ?? goals[0];
  const labels = Object.fromEntries(Object.entries(FORM).map(([k, v]) => [k, pick(lang, v)]));
  const waText = `${pick(lang, picked.text)}: ${carName} (${lotRef})${pageUrl ? ` — ${pageUrl}` : ""}`;

  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        backgroundColor: "var(--axis-charcoal)",
        border: "1.5px solid rgba(182,119,73,0.5)",
        boxShadow: "0 0 24px rgba(182,119,73,0.12)",
      }}
    >
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--axis-orange), var(--axis-amber))" }} />
      <div className="p-5">
        <div className="mb-1 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: "#22c55e" }} />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#22c55e" }} />
          </span>
          <p className="text-base font-bold" style={{ color: "var(--axis-white)" }}>
            {pick(lang, UI.want)}
          </p>
        </div>
        <p className="mb-3 text-xs" style={{ color: "var(--axis-gray)" }}>
          {pick(lang, UI.within)}
        </p>

        {/* Цель обращения. role=radiogroup: выбирается ровно одна. */}
        <div role="radiogroup" aria-label={pick(lang, UI.need)} className="mb-4 grid grid-cols-2 gap-2">
          {goals.map((g) => {
            const on = g.id === goal;
            return (
              <button
                key={g.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setGoal(g.id)}
                className="rounded-lg px-2 py-2 text-xs font-semibold leading-tight transition-colors"
                style={{
                  border: `1px solid ${on ? "var(--axis-bronze)" : "rgba(74,74,74,0.5)"}`,
                  color: on ? "var(--axis-bronze)" : "var(--axis-cream, #F5F0EB)",
                  backgroundColor: on ? "rgba(182,119,73,0.1)" : "transparent",
                }}
              >
                {pick(lang, g.label)}
              </button>
            );
          })}
        </div>

        <CarRequestForm
          carId={carId}
          carName={carName}
          source="auction_lot"
          message={`${picked.text[0]}. ${lotRefRu}${pageUrl ? ` · ${pageUrl}` : ""}`}
          labels={labels}
        />

        <a
          href={waHref(waText)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-medium"
          style={{ color: "#25D366", border: "1px solid rgba(37,211,102,0.35)" }}
        >
          {pick(lang, UI.whatsapp)}
        </a>
      </div>
    </div>
  );
}
