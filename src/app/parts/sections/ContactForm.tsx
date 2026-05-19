"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Phone, User, MessageSquare, PhoneCall } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

const MESSENGER_OPTIONS = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    color: "#25D366",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.533 5.843L0 24l6.335-1.508A11.956 11.956 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.372l-.36-.214-3.724.977.994-3.634-.234-.374A9.818 9.818 0 0 1 2.182 12C2.182 6.575 6.575 2.182 12 2.182S21.818 6.575 21.818 12 17.425 21.818 12 21.818z"/>
      </svg>
    ),
  },
  {
    id: "telegram",
    label: "Telegram",
    color: "#229ED9",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
  },
  {
    id: "viber",
    label: "Viber",
    color: "#7360F2",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.4 0C8.53 0 3.1.6 1.06 6.18.18 8.49 0 11.37 0 12.8c0 1.83.15 5.22 1.47 7.54.65 1.14 1.77 2.08 3.27 2.71L5.3 24l1.7-.58C8.3 24 9.9 24 11.4 24c2.85 0 8.6-.59 10.6-6.1.89-2.38 1.06-5.22 1.06-6.13 0-4.7-1.18-8.3-3.55-10.56C17.24.56 14.58 0 11.4 0zm.08 1.88c2.75 0 5.12.52 6.89 2.21 1.86 1.77 2.8 4.73 2.8 8.92 0 .47-.08 2.88-.88 5.01-1.6 4.36-5.8 4.93-8.89 4.93-1.36 0-2.95-.12-4.18-.53l-.99.34-.45-1.78-.43-.17C4.04 19.88 3 18.94 2.42 17.93 1.3 15.94 1.15 12.78 1.15 12.8c0-1.26.18-3.95 1.01-6.09C3.88 2.42 8.42 1.88 11.48 1.88zm.6 2.12c-.29 0-.77.09-.77.09-.2.05-.36.21-.44.42-.14.36-.09.74.11 1.06.26.41.47.58.47.58.24.19.58.23.86.1l.22-.11c.55.15 1.06.41 1.5.79.38.34.66.76.85 1.22l-.1.22c-.14.29-.1.64.1.88 0 0 .17.2.59.47.33.21.71.26 1.07.12.21-.08.37-.24.42-.45 0 0 .08-.47.08-.77 0-2.1-1.72-3.82-3.82-3.82-.02 0-.04 0-.06 0-.02 0-.04 0-.06 0z"/>
      </svg>
    ),
  },
];


export function ContactForm() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [messenger, setMessenger] = useState<string>("whatsapp");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: "",
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, source: "parts", messenger }),
      });
      if (!response.ok) throw new Error("Send error");
      toast.success(t("parts.contact.successMsg"));
      setFormData({ name: "", phone: "", message: "" });
    } catch {
      toast.error(t("parts.contact.errorMsg"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contacts"
      ref={sectionRef}
      className="py-24 bg-gradient-to-br from-[#002C5F] to-[#001f45] relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#BB162B]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-[#BB162B]" />
            <span className="text-[#BB162B] text-sm font-medium tracking-wider uppercase">
              {t("parts.contact.badge")}
            </span>
            <div className="h-px w-12 bg-[#BB162B]" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            {t("parts.contact.title")}
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            {t("parts.contact.subtitle")}
          </p>
        </div>

        {/* Form Card */}
        <div
          className={`max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="grid md:grid-cols-5">
            {/* Left side - Contact info */}
            <div className="md:col-span-2 bg-[#002C5F] p-8 text-white">
              <h3 className="text-xl font-semibold mb-6">{t("parts.contact.contactsTitle")}</h3>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm text-white/60 mb-1">{t("parts.contact.phoneLabel")}</div>
                    <a
                      href="tel:+821077324344"
                      className="font-medium hover:text-[#BB162B] transition-colors"
                    >
                      +8210 7732 4344
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm text-white/60 mb-1">{t("parts.contact.telegramLabel")}</div>
                    <a
                      href="https://t.me/caparts"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:text-[#BB162B] transition-colors"
                    >
                      @caparts
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm text-white/60 mb-1">{t("parts.contact.telegramLabel")}</div>
                    <a
                      href="https://t.me/koreanapart"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:text-[#BB162B] transition-colors"
                    >
                      @koreanapart
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-white/20">
                <div className="text-sm text-white/60 mb-2">{t("parts.contact.hoursTitle")}</div>
                <div className="font-medium">{t("parts.contact.weekdays")}</div>
                <div className="text-white/60">{t("parts.contact.weekend")}</div>
              </div>
            </div>

            {/* Right side - Form */}
            <div className="md:col-span-3 p-8 flex flex-col justify-center">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700">
                    {t("parts.contact.nameLabel")} <span className="text-[#BB162B]">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={t("parts.contact.namePlaceholder")}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700">
                    {t("parts.contact.phoneLabel")} <span className="text-[#BB162B]">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder={t("parts.contact.phonePlaceholder")}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">{t("parts.contact.messengerLabel")}</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {MESSENGER_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setMessenger(opt.id)}
                        className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border-2 text-xs font-medium transition-all"
                        style={
                          messenger === opt.id
                            ? { borderColor: opt.color, color: opt.color, backgroundColor: `${opt.color}12` }
                            : { borderColor: "#e5e7eb", color: "#6b7280" }
                        }
                      >
                        <span style={{ color: messenger === opt.id ? opt.color : "#9ca3af" }}>{opt.icon}</span>
                        {opt.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setMessenger("call")}
                      className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border-2 text-xs font-medium transition-all"
                      style={
                        messenger === "call"
                          ? { borderColor: "#6b7280", color: "#374151", backgroundColor: "#6b728012" }
                          : { borderColor: "#e5e7eb", color: "#6b7280" }
                      }
                    >
                      <PhoneCall className="w-4 h-4" />
                      {t("parts.contact.messengerCall")}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-gray-700">
                    {t("parts.contact.messageLabel")}
                  </Label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder={t("parts.contact.messagePlaceholder")}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#BB162B] hover:bg-[#9B1220] text-white py-6 text-base font-semibold"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t("parts.contact.submittingBtn")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-5 h-5" />
                      {t("parts.contact.submitBtn")}
                    </span>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  {t("parts.contact.privacy")}
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
