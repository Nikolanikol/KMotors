"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
export default function ContactForm({ isVisible }: { isVisible: boolean }) {
  const [visible, setVisible] = useState(isVisible);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
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
      setForm({ name: "", phone: "", email: "", message: "" });
    } else {
      alert("Ошибка при отправке");
    }
  };

  return (
    <div className="max-w-md ">
      <Button onClick={() => setVisible(!visible)}>
        {visible ? "Скрыть форму" : "Оставить заявку"}
      </Button>

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
              <Textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Комментарий или модель авто"
                rows={4}
              />
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Отправка..." : "Отправить"}
              </Button>
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
