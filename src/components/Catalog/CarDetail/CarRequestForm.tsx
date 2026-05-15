"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Loader2, Send, CheckCircle2 } from "lucide-react";

interface CarRequestFormProps {
  carId: string;
  carName: string;
  source?: string;
  onSuccess?: () => void;
}

export default function CarRequestForm({
  carId,
  carName,
  source = "car_detail",
  onSuccess,
}: CarRequestFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          source,
          carId,
          carName,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setName("");
        setPhone("");
        onSuccess?.();
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
      <Input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder={t("contact.phone")}
        type="tel"
        required
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !name.trim() || !phone.trim()}
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
