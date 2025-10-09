"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SlidingButton } from "@/components/ui/button";
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
export default function ContactForm({ isVisible }: { isVisible: boolean }) {
  const [visible, setVisible] = useState(isVisible);
  const count = useRef(0);
  const intervalId = useRef<NodeJS.Timeout | number>(0);

  useEffect(() => {
    intervalId.current = setInterval(() => {
      if (count.current >= 5) {
        clearInterval(intervalId.current); // остановка интервала
        return;
      }
      setVisible(true);
      count.current++;
    }, 5000);

    return () => clearInterval(intervalId.current); // очистка при размонтировании
  }, []);
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
      alert("Ошибка при отправке");
    }
  };

  return (
    <div className="max-w-md ">
      <SlidingButton onClick={() => setVisible(!visible)}>
        {visible ? "Скрыть форму" : "Оставить заявку"}
      </SlidingButton>

      {visible && (
        <Dialog open={visible} onOpenChange={setVisible}>
          {/* <DialogTrigger asChild>
            <Button>Оставить заявку</Button>
          </DialogTrigger> */}

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
              />
              <Input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Телефон"
                required
              />
              <Input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
              />
              <Select
                required
                value={form.method}
                onValueChange={(value) => setForm({ ...form, method: value })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Способ связи" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="whatsapp">Whatsapp</SelectItem>
                  <SelectItem value="phone">Звонок</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Комментарий или модель авто"
                rows={4}
              />
              <SlidingButton
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? "Отправка..." : "Отправить"}
              </SlidingButton>
              {success && (
                <p className="text-green-600 text-sm text-center">
                  ✅ Заявка успешно отправлена
                </p>
              )}
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
