"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { type Value } from "react-phone-number-input";
import { SlidingButton } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { MessengerSelector } from "@/components/ui/MessengerSelector";
import { Input } from "@/components/ui/input";

export default function ContactForm() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [phone, setPhone] = useState<Value | undefined>();
  const [messenger, setMessenger] = useState("whatsapp");
  const [tgUsername, setTgUsername] = useState("");

  const [form, setForm] = useState({ name: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: phone ?? "",
          messenger,
          tg_username: tgUsername || undefined,
          source: "contact",
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setForm({ name: "", message: "" });
        setPhone(undefined);
        setTgUsername("");
      } else {
        alert(t("contact.error"));
      }
    } catch {
      alert(t("contact.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder={t("contact.name")}
          required
        />
        <PhoneInput
          value={phone}
          onChange={setPhone}
          placeholder={t("contact.phone")}
          required
        />
        <Input
          name="message"
          value={form.message}
          onChange={handleChange}
          placeholder={t("contact.message")}
        />
        <MessengerSelector
          messenger={messenger}
          onMessengerChange={setMessenger}
          tgUsername={tgUsername}
          onTgUsernameChange={setTgUsername}
          label={t("contact.messengerLabel")}
          usernamePlaceholder={t("contact.tgUsernamePlaceholder")}
        />
        <SlidingButton
          type="submit"
          disabled={loading || !form.name || !phone}
          className="w-full"
        >
          {loading ? t("contact.sending") : t("contact.send")}
        </SlidingButton>
        {success && (
          <p className="text-green-600 text-sm text-center">
            ✅ {t("contact.success")}
          </p>
        )}
      </form>
    </div>
  );
}
