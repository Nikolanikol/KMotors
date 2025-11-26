"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SlidingButton } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
export default function ContactForm() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
    method: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      setForm({ name: "", phone: "", email: "", message: "", method: "" });
    } else {
      alert(t('contact.error'));
    }
  };

  return (
    <div className="max-w-md ">
      <form onSubmit={handleSubmit} className="space-y-4 ">
        <Input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder={t('contact.name')}
          required
        />
        <Input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder={t('contact.phone')}
          required
        />
        <Input
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder={t('contact.email')}
        />
        <Select
          required
          value={form.method}
          onValueChange={(value) => setForm({ ...form, method: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('contact.contactMethod')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="telegram">Telegram</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="phone">{t('contact.phoneCall')}</SelectItem>
          </SelectContent>
        </Select>
        <Textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          placeholder={t('contact.message')}
          rows={4}
        />
        <SlidingButton type="submit" disabled={loading} className="w-full">
          {loading ? t('contact.sending') : t('contact.send')}
        </SlidingButton>
        {success && (
          <p className="text-green-600 text-sm text-center">
            ✅ {t('contact.success')}
          </p>
        )}
      </form>
    </div>
  );
}
