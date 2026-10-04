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
// ⚠️ Подписи — строками, а не через i18next: под /admin инстанса нет. При
// переносе на витрину перевести в словарь и добавить в текст WhatsApp НАШ
// адрес лота (правило lotAskText в src/lib/contact.ts) — сейчас публичной
// страницы нет, и ссылку давать некуда.

import { useState } from "react";

import CarRequestForm from "@/components/Catalog/CarDetail/CarRequestForm";
import { waHref } from "@/lib/contact";

const LABELS = {
  successModal: "Заявка отправлена",
  subtitle: "Менеджер свяжется с вами в ближайшее время",
  yourName: "Ваше имя",
  phone: "Телефон",
  messengerLabel: "Как с вами связаться?",
  tgUsernamePlaceholder: "@ваш_username в Telegram",
  submitting: "Отправка…",
  submit: "Отправить заявку",
  errorSend: "Не отправилось, попробуйте ещё раз",
};

export default function LotRequestCard({
  carId,
  carName,
  lotRef,
  fixedPrice,
}: {
  carId: string;
  carName: string;
  /** «K Car · Sejong, лот 1234, торги 2026-10-06» — что увидит менеджер. */
  lotRef: string;
  /** HeyDealer Instant: торгов нет, машину выкупают по цене. */
  fixedPrice: boolean;
}) {
  const goals = [
    fixedPrice
      ? { id: "buy", label: "Выкупить", text: "Хочу выкупить по фиксированной цене" }
      : { id: "bid", label: "Участвовать в торгах", text: "Хочу участвовать в торгах за этот лот" },
    { id: "turnkey", label: "Цена под ключ", text: "Посчитайте цену под ключ с доставкой и растаможкой" },
    { id: "check", label: fixedPrice ? "Проверить машину" : "Проверить до торгов", text: "Проверьте машину перед покупкой" },
    { id: "ask", label: "Задать вопрос", text: "Есть вопрос по машине" },
  ];
  const [goal, setGoal] = useState(goals[0].id);
  const picked = goals.find((g) => g.id === goal) ?? goals[0];

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
            Хочу эту машину
          </p>
        </div>
        <p className="mb-3 text-xs" style={{ color: "var(--axis-gray)" }}>
          Менеджер свяжется в течение часа
        </p>

        {/* Цель обращения. role=radiogroup: выбирается ровно одна. */}
        <div role="radiogroup" aria-label="Что нужно" className="mb-4 grid grid-cols-2 gap-2">
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
                {g.label}
              </button>
            );
          })}
        </div>

        <CarRequestForm
          carId={carId}
          carName={carName}
          source="auction_lot"
          message={`${picked.text}. ${lotRef}`}
          labels={LABELS}
        />

        <a
          href={waHref(`${picked.text}: ${carName} (${lotRef})`)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-medium"
          style={{ color: "#25D366", border: "1px solid rgba(37,211,102,0.35)" }}
        >
          Написать в WhatsApp
        </a>
      </div>
    </div>
  );
}
