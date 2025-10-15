"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SlidingButton } from "@/components/ui/button";
import { usePathname } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import SocialRow from "../ui/SocialRow";

export default function ContactForm({ isVisible }: { isVisible: boolean }) {
  // ========== СОСТОЯНИЕ ==========
  const [visible, setVisible] = useState(isVisible);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // ✅ FIX: Получаем текущий путь чтобы не триггерить в админке
  const pathname = usePathname();

  // ========== REFS ==========
  // ✅ FIX: Используем useRef для флага (он не будет перерисовываться)
  const hasTriggeredRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ========== ФОРМА ==========
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
    method: "",
  });

  // ========== ТАЙМЕР ДЛЯ АВТОМАТИЧЕСКОГО ПОКАЗА ==========
  useEffect(() => {
    // ✅ FIX: Если уже показывали или явно открыта - не показываем снова
    if (hasTriggeredRef.current || isVisible) {
      return;
    }
    // ✅ FIX: НЕ триггерим форму в админке!
    if (pathname.startsWith("/admin")) {
      console.log("🔒 В админке - форма не триггерится");
      return;
    }
    console.log("⏱️ Таймер на показ формы запущен: 30 сек");

    // ✅ FIX: setTimeout вместо setInterval (нужен только один раз)
    timerRef.current = setTimeout(() => {
      if (!hasTriggeredRef.current) {
        console.log("📋 Показываем форму по таймеру");
        setVisible(true);
        hasTriggeredRef.current = true; // ✅ Отмечаем что уже показали
      }
    }, 30000); // 30 секунд

    // ✅ FIX: Очистка при размонтировании
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        console.log("🧹 Таймер очищен");
      }
    };
  }, [isVisible]); // ✅ FIX: Добавили зависимость isVisible

  // ========== ОБРАБОТЧИКИ ==========
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleOpenChange = (open: boolean) => {
    setVisible(open);
    console.log(`🔄 Dialog ${open ? "открыт" : "закрыт"}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        console.log("✅ Форма успешно отправлена");
        setSuccess(true);
        setForm({ name: "", phone: "", email: "", message: "", method: "" });

        // ✅ FIX: Автоматически закрываем через 2 секунды
        setTimeout(() => {
          setVisible(false);
        }, 2000);
      } else {
        console.error("❌ Ошибка при отправке");
        alert("Ошибка при отправке");
      }
    } catch (error) {
      console.error("❌ Ошибка подключения:", error);
      alert("Ошибка подключения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <SlidingButton
        onClick={() => {
          console.log("👆 Нажата кнопка 'Оставить заявку'");
          setVisible(true);
        }}
      >
        {visible ? "Скрыть форму" : "Оставить заявку"}
      </SlidingButton>

      {visible && (
        <Dialog open={visible} onOpenChange={handleOpenChange}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">Оставьте заявку</DialogTitle>
              <DialogDescription className="text-center text-sm text-muted-foreground">
                Мы свяжемся с вами в ближайшее время
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ваше имя"
                required
                disabled={loading}
              />
              <Input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Телефон"
                required
                disabled={loading}
              />
              <Input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                disabled={loading}
              />
              <Select
                required
                value={form.method}
                onValueChange={(value) => setForm({ ...form, method: value })}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Способ связи" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="telegram">💬 Telegram</SelectItem>
                  <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                  <SelectItem value="phone">☎️ Звонок</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Комментарий или модель авто"
                rows={4}
                disabled={loading}
              />
              <SlidingButton
                type="submit"
                disabled={loading || !form.name || !form.phone || !form.method}
                className="w-full"
              >
                {loading ? "⏳ Отправка..." : "✉️ Отправить"}
              </SlidingButton>
              {success && (
                <p className="text-green-600 text-sm text-center font-bold">
                  ✅ Заявка успешно отправлена
                </p>
              )}
            </form>
            <hr />

            <div>
              {" "}
              <SocialRow />
              {/* <a
                  href="https://www.tiktok.com/@kmotorrss"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-800"
                >
                  <FaTiktok />
                </a> */}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
