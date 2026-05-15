"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { SlidingButton } from "@/components/ui/button";
import { usePathname } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import SocialRow from "../ui/SocialRow";

export default function ContactForm({ isVisible }: { isVisible: boolean }) {
  const { t } = useTranslation("common");
  const [visible, setVisible] = useState(isVisible);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const pathname = usePathname();
  const hasTriggeredRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    message: "",
  });

  // Автопоказ: один раз, потом 7 дней не беспокоить
  useEffect(() => {
    if (hasTriggeredRef.current || isVisible) return;
    if (pathname.startsWith("/admin")) return;
    // На карточке машины форма уже есть прямо под ценой
    if (pathname.match(/\/catalog\/\d+/)) return;

    // Проверяем localStorage — видел ли пользователь модалку за последние 7 дней
    try {
      const seen = localStorage.getItem("kmotors_modal_seen");
      if (seen) {
        const seenDate = parseInt(seen, 10);
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - seenDate < sevenDays) return;
      }
    } catch {
      // localStorage недоступен (приватный режим) — показываем как обычно
    }

    timerRef.current = setTimeout(() => {
      if (!hasTriggeredRef.current) {
        setVisible(true);
        hasTriggeredRef.current = true;
        try {
          localStorage.setItem("kmotors_modal_seen", Date.now().toString());
        } catch {}
      }
    }, 30000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isVisible, pathname]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleOpenChange = (open: boolean) => setVisible(open);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "header" }),
      });

      if (res.ok) {
        setSuccess(true);
        setForm({ name: "", phone: "", message: "" });
        setTimeout(() => setVisible(false), 2000);
      } else {
        alert(t("contact.errorSend"));
      }
    } catch {
      alert(t("contact.errorSend"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <SlidingButton onClick={() => setVisible(true)}>
        {t("contact.openForm")}
      </SlidingButton>

      {visible && (
        <Dialog open={visible} onOpenChange={handleOpenChange}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">{t("contact.leaveRequest")}</DialogTitle>
              <DialogDescription className="text-center text-sm text-muted-foreground">
                {t("contact.subtitle")}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder={t("contact.yourName")}
                required
                disabled={loading}
              />
              <Input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder={t("contact.phone")}
                required
                disabled={loading}
              />
              <Input
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder={t("contact.message")}
                disabled={loading}
              />
              <SlidingButton
                type="submit"
                disabled={loading || !form.name || !form.phone}
                className="w-full"
              >
                {loading ? t("contact.submitting") : t("contact.submit")}
              </SlidingButton>
              {success && (
                <p className="text-green-600 text-sm text-center font-bold">
                  {t("contact.successModal")}
                </p>
              )}
            </form>
            <hr />
            <SocialRow />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
