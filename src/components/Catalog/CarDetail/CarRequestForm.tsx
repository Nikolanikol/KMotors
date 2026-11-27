"use client";

import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { type Value } from "react-phone-number-input";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { MessengerSelector } from "@/components/ui/MessengerSelector";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { trackEvent, trackOnce } from "@/utils/gtag";
import { clarityEvent } from "@/utils/clarity";

interface CarRequestFormProps {
  carId?: string;
  carName?: string;
  /** Свободный комментарий → уходит в Telegram как «Комментарий» (напр. параметры расчёта калькулятора). */
  message?: string;
  source?: string;
  onSuccess?: () => void;
  /**
   * Закрыть контейнер (модалку). Если передан — на экране «Заявка отправлена»
   * появляется кнопка «Закрыть»: формa сама контейнер не закрывает, чтобы клиент
   * успел увидеть подтверждение.
   */
  onClose?: () => void;
  /**
   * Готовые подписи вместо словаря. Нужны там, где инстанса i18next нет вовсе —
   * под /admin (страница машины carnect): без них форма показала бы сырые ключи.
   */
  labels?: Partial<Record<FormLabel | ExtraLabel, string>>;
}

type FormLabel =
  | "successModal"
  | "subtitle"
  | "yourName"
  | "phone"
  | "messengerLabel"
  | "tgUsernamePlaceholder"
  | "submitting"
  | "submit"
  | "errorSend";

/**
 * Подписи, которых нет в разделе `contact`: живут в `car.*` словаря. Под /admin
 * инстанса i18next нет — там их берут только из `labels`, а нет подписи, нет и
 * элемента (сырой ключ клиенту не показываем).
 */
type ExtraLabel = "hintName" | "hintPhone" | "hintBoth" | "close";
const EXTRA_KEYS: Record<ExtraLabel, string> = {
  hintName: "car.formHintName",
  hintPhone: "car.formHintPhone",
  hintBoth: "car.formHintBoth",
  close: "car.close",
};

export default function CarRequestForm({
  carId,
  carName,
  message,
  source = "car_detail",
  onSuccess,
  onClose,
  labels,
}: CarRequestFormProps) {
  const { t: tr } = useTranslation();
  const t = (key: `contact.${FormLabel}`) => labels?.[key.slice(8) as FormLabel] ?? tr(key);
  const extra = (key: ExtraLabel): string | null =>
    labels ? (labels[key] ?? null) : tr(EXTRA_KEYS[key]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState<Value | undefined>();
  const [messenger, setMessenger] = useState("whatsapp");
  const [tgUsername, setTgUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  // Кнопка «Отправить» без имени/телефона неактивна — подсказка говорит, чего
  // не хватает (иначе серая кнопка выглядит сломанной).
  const needName = !name.trim();
  const needPhone = !phone;
  const hint = needName && needPhone ? extra("hintBoth") : needName ? extra("hintName") : needPhone ? extra("hintPhone") : null;
  const hintId = useId();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // ⚠️ Пустая отправка молча ничего не делает — это точка потери заявки, и её
    // надо видеть в воронке: какое поле не заполнили.
    if (!name.trim() || !phone) {
      trackEvent("form_invalid", {
        source,
        car_id: carId,
        missing: [!name.trim() && "name", !phone && "phone"].filter(Boolean).join(","),
      });
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          messenger,
          tg_username: tgUsername || undefined,
          source,
          carId: carId || undefined,
          carName: carName || undefined,
          message: message || undefined,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setName("");
        setPhone(undefined);
        setTgUsername("");
        onSuccess?.();
        trackEvent("generate_lead", { source, car_id: carId, car_name: carName });
        clarityEvent("form_submit");
      } else {
        setError(true);
        trackEvent("form_error", { source, car_id: carId, status: res.status });
      }
    } catch {
      setError(true);
      trackEvent("form_error", { source, car_id: carId, status: "network" });
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    const closeLabel = onClose ? extra("close") : null;
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-4 text-center" role="status">
        <CheckCircle2 className="w-10 h-10 text-green-400" aria-hidden="true" />
        <p className="font-semibold" style={{ color: "var(--axis-white)" }}>
          {/* «✅» в словаре стоит и в других местах; рядом с иконкой он дублирует её */}
          {t("contact.successModal").replace(/^✅\s*/, "")}
        </p>
        <p className="text-sm" style={{ color: "var(--axis-silver)" }}>
          {t("contact.subtitle")}
        </p>
        {onClose && closeLabel && (
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="mt-2 w-full py-3 rounded-xl font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]"
            style={{ backgroundColor: "var(--axis-bronze-deep)", backgroundImage: "var(--axis-bronze-fill)" }}
          >
            {closeLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      // Шаг воронки «начал заполнять» — первый фокус в любом поле, раз за страницу.
      onFocus={() => trackOnce(`form_start:${source}`, "form_start", { source, car_id: carId })}
      className="space-y-3"
    >
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("contact.yourName")}
        required
        disabled={loading}
      />
      <PhoneInput
        value={phone}
        onChange={setPhone}
        placeholder={t("contact.phone")}
        required
        disabled={loading}
      />
      <MessengerSelector
        messenger={messenger}
        onMessengerChange={setMessenger}
        tgUsername={tgUsername}
        onTgUsernameChange={setTgUsername}
        label={t("contact.messengerLabel")}
        usernamePlaceholder={t("contact.tgUsernamePlaceholder")}
        tone="dark"
      />
      <button
        type="submit"
        disabled={loading || !name.trim() || !phone}
        aria-describedby={hint ? hintId : undefined}
        className="w-full flex items-center justify-center gap-2 enabled:hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]"
        // Бронзовая заливка (см. «Бренд» в CLAUDE.md): здесь до 04.10.2026
        // оставался tailwind-оранжевый bg-orange-500 со времён старой палитры.
        style={{ backgroundColor: "var(--axis-bronze-deep)", backgroundImage: "var(--axis-bronze-fill)" }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t("contact.submitting")}
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            {t("contact.submit")}
          </>
        )}
      </button>
      {hint && !loading && (
        <p
          id={hintId}
          role="status"
          className="text-xs text-center"
          style={{ color: "var(--axis-silver)" }}
        >
          {hint}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-500 text-center">{t("contact.errorSend")}</p>
      )}
    </form>
  );
}
