"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { SlidingButton } from "@/components/ui/button";

export default function ContactForm() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    message: "",
  });

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
        body: JSON.stringify({ ...form, source: "contact" }),
      });

      if (res.ok) {
        setSuccess(true);
        setForm({ name: "", phone: "", message: "" });
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
        <Input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder={t("contact.phone")}
          required
        />
        <Input
          name="message"
          value={form.message}
          onChange={handleChange}
          placeholder={t("contact.message")}
        />
        <SlidingButton
          type="submit"
          disabled={loading || !form.name || !form.phone}
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
