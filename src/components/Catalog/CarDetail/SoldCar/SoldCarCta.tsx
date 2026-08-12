"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { BellRing, MessageCircle, Send } from "lucide-react";
import { trackEvent } from "@/utils/gtag";
import { clarityEvent } from "@/utils/clarity";

// Те же контакты, что в NoResultsBanner и MessengerButtons.
const WA_PHONE = "821058654344";
const TG_MANAGER = "axiskorea";
// Клиентский бот сайта — он же принимает ?start=website из плавающей кнопки.
const TG_BOT = "KMOTORS_form_bot";

interface Props {
  carId: string;
  /** Читаемое имя машины для текста сообщения; пусто, если снимка не было. */
  carName: string;
}

/**
 * Блок действий на странице проданной машины.
 *
 * Ключевой из трёх — подписка: она уходит в бота deep-link'ом ?start=sold_<id>,
 * то есть в один тап, без формы и без регистрации. Мессенджеры рядом потому же,
 * почему они стоят в NoResultsBanner: часть людей не хочет бота и уйдёт, если
 * другого пути нет.
 */
export default function SoldCarCta({ carId, carName }: Props) {
  const { t } = useTranslation();

  // Один трек на машину, а не на каждый ре-рендер.
  const tracked = useRef<string | null>(null);
  useEffect(() => {
    if (tracked.current === carId) return;
    tracked.current = carId;
    trackEvent("sold_car_view", { car_id: carId, car_name: carName || "(no snapshot)" });
    clarityEvent("sold_car_view");
  }, [carId, carName]);

  const msg = carName
    ? t("catalog.sold.msgCar", { car: carName })
    : t("catalog.sold.msg");

  const subscribeUrl = `https://t.me/${TG_BOT}?start=sold_${carId}`;
  const waUrl = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`;
  const tgUrl = `https://t.me/${TG_MANAGER}?text=${encodeURIComponent(msg)}`;

  const onSubscribe = () => {
    trackEvent("sold_car_subscribe", { car_id: carId, car_name: carName || "(no snapshot)" });
    clarityEvent("sold_car_subscribe");
  };

  const onMessenger = (channel: "whatsapp" | "telegram") => {
    trackEvent("sold_car_messenger", { channel, car_id: carId });
    clarityEvent(`sold_car_${channel}`);
  };

  return (
    <div className="mt-8">
      <a
        href={subscribeUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onSubscribe}
        className="flex items-center justify-center gap-2.5 w-full h-14 rounded-2xl font-bold text-base transition-all duration-200 hover:-translate-y-0.5"
        style={{ backgroundColor: "var(--axis-bronze-deep)", backgroundImage: "var(--axis-bronze-fill)", color: "#fff" }}
      >
        <BellRing className="w-5 h-5" />
        {t("catalog.sold.subscribe")}
      </a>
      <p
        className="text-xs text-center mt-2.5"
        style={{ color: "var(--axis-gray)" }}
      >
        {t("catalog.sold.subscribeHint")}
      </p>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onMessenger("whatsapp")}
          className="flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
          style={{ backgroundColor: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.3)" }}
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </a>
        <a
          href={tgUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onMessenger("telegram")}
          className="flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
          style={{ backgroundColor: "rgba(42,171,238,0.12)", color: "#2AABEE", border: "1px solid rgba(42,171,238,0.3)" }}
        >
          <Send className="w-4 h-4" />
          Telegram
        </a>
      </div>
    </div>
  );
}
