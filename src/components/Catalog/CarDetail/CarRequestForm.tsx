"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { type Value } from "react-phone-number-input";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { MessengerSelector } from "@/components/ui/MessengerSelector";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { trackEvent } from "@/utils/gtag";
import { clarityEvent } from "@/utils/clarity";

interface CarRequestFormProps {
  carId?: string;
  carName?: string;
  /** Свободный комментарий → уходит в Telegram как «Комментарий» (напр. параметры расчёта калькулятора). */
  message?: string;
  source?: string;
  onSuccess?: () => void;
}

export default function CarRequestForm({
  carId,
  carName,
  message,
  source = "car_detail",
  onSuccess,
}: CarRequestFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState<Value | undefined>();
  const [messenger, setMessenger] = useState("whatsapp");
  const [tgUsername, setTgUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone) return;

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
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
        <p className="font-semibold text-green-700">
          {t("contact.successModal")}
        </p>
        <p className="text-sm text-gray-500">
          {t("contact.subtitle")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
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
      />
      <button
        type="submit"
        disabled={loading || !name.trim() || !phone}
        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
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
      {error && (
        <p className="text-sm text-red-500 text-center">{t("contact.errorSend")}</p>
      )}
    </form>
  );
}
