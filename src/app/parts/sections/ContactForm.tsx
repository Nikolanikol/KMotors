"use client";
import { useEffect, useRef, useState } from "react";
import { type Value } from "react-phone-number-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { MessengerSelector } from "@/components/ui/MessengerSelector";
import { Send, Phone, User, MessageSquare, Hash, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/utils/gtag";

const PART_TYPES = [
  { key: "vin",  emoji: "🔍" },
  { key: "part", emoji: "🔧" },
  { key: "used", emoji: "📦" },
  { key: "other",emoji: "✏️" },
] as const;

export function ContactForm() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const [messenger, setMessenger] = useState("whatsapp");
  const [tgUsername, setTgUsername] = useState("");
  const [phone, setPhone] = useState<Value | undefined>();
  const [partType, setPartType] = useState("");

  const [formData, setFormData] = useState({ name: "", vin: "", message: "" });

  // Prefill from catalog "Order" button
  useEffect(() => {
    const prefill = sessionStorage.getItem("prefillMessage");
    if (prefill) {
      setFormData((prev) => ({ ...prev, message: prefill }));
      sessionStorage.removeItem("prefillMessage");
    }
  }, []);

  // Computed validation — errors only show after first submit attempt
  const errors = {
    name:     attempted && !formData.name.trim(),
    phone:    attempted && !phone,
    partType: attempted && !partType,
    message:  attempted && !formData.message.trim(),
  };

  const isValid =
    !!formData.name.trim() &&
    !!phone &&
    !!partType &&
    !!formData.message.trim();

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
    setAttempted(true);

    if (!isValid) return; // errors are now visible — stop here

    setIsSubmitting(true);
    try {
      const partTypeLabel = partType
        ? `${PART_TYPES.find(p => p.key === partType)?.emoji} ${t(`parts.contact.partType.${partType}`)}`
        : "";
      const fullMessage = [
        partTypeLabel ? `[${partTypeLabel}]` : "",
        formData.message,
      ].filter(Boolean).join("\n");

      const response = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          message: fullMessage || undefined,
          phone: phone ?? "",
          messenger,
          tg_username: tgUsername || undefined,
          source: "parts",
        }),
      });
      if (!response.ok) throw new Error("Send error");
      trackEvent("generate_lead", { source: "parts_contact" });
      toast.success(t("parts.contact.successMsg"));
      setFormData({ name: "", vin: "", message: "" });
      setPhone(undefined);
      setTgUsername("");
      setPartType("");
      setAttempted(false);
    } catch {
      toast.error(t("parts.contact.errorMsg"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const errorHint = (show: boolean) =>
    show ? (
      <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        {t("parts.contact.errorRequired")}
      </p>
    ) : null;

  return (
    <section
      id="contacts"
      ref={sectionRef}
      className="py-24 bg-gradient-to-br from-[#002C5F] to-[#001f45] relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#BB162B]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
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

        <div
          className={`max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="grid md:grid-cols-5">
            {/* Left side */}
            <div className="md:col-span-2 bg-[#002C5F] p-8 text-white">
              <h3 className="text-xl font-semibold mb-6">{t("parts.contact.contactsTitle")}</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm text-white/60 mb-1">{t("parts.contact.phoneLabel")}</div>
                    <a href="tel:+821058654344" className="font-medium hover:text-[#BB162B] transition-colors">
                      +8210 5865 4344
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
                      href="https://t.me/avto_korea_nikolai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:text-[#BB162B] transition-colors"
                    >
                      @avto_korea_nikolai
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
              <form onSubmit={handleSubmit} noValidate className="space-y-5">

                {/* Name */}
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-gray-700">
                    {t("parts.contact.nameLabel")} <span className="text-[#BB162B]">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={t("parts.contact.namePlaceholder")}
                      className={cn(
                        "pl-10 text-gray-900 placeholder:text-gray-400",
                        errors.name && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
                  </div>
                  {errorHint(errors.name)}
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <Label className="text-gray-700">
                    {t("parts.contact.phoneLabel")} <span className="text-[#BB162B]">*</span>
                  </Label>
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                    placeholder={t("parts.contact.phonePlaceholder")}
                    error={errors.phone}
                  />
                  {errorHint(errors.phone)}
                </div>

                {/* VIN */}
                <div className="space-y-1">
                  <Label htmlFor="vin" className="text-gray-700">
                    {t("parts.contact.vinLabel")}
                  </Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="vin"
                      name="vin"
                      value={formData.vin}
                      onChange={handleChange}
                      placeholder={t("parts.contact.vinPlaceholder")}
                      className="pl-10 uppercase text-gray-900 placeholder:text-gray-400"
                      maxLength={17}
                    />
                  </div>
                </div>

                {/* Part type chips — required */}
                <div className="space-y-1">
                  <Label className="text-gray-700">
                    {t("parts.contact.partTypeLabel")} <span className="text-[#BB162B]">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PART_TYPES.map(({ key, emoji }) => {
                      const active = partType === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setPartType(key)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all text-left"
                          style={
                            active
                              ? { borderColor: "#BB162B", color: "#BB162B", backgroundColor: "#BB162B12" }
                              : errors.partType
                                ? { borderColor: "#ef4444", color: "#6b7280" }
                                : { borderColor: "#e5e7eb", color: "#6b7280" }
                          }
                        >
                          <span>{emoji}</span>
                          <span>{t(`parts.contact.partType.${key}`)}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errorHint(errors.partType)}
                </div>

                {/* Messenger */}
                <MessengerSelector
                  messenger={messenger}
                  onMessengerChange={setMessenger}
                  tgUsername={tgUsername}
                  onTgUsernameChange={setTgUsername}
                  label={t("parts.contact.messengerLabel")}
                  usernamePlaceholder={t("contact.tgUsernamePlaceholder")}
                />

                {/* Part description — required */}
                <div className="space-y-1">
                  <Label htmlFor="message" className="text-gray-700">
                    {t("parts.contact.messageLabel")} <span className="text-[#BB162B]">*</span>
                  </Label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder={t("parts.contact.messagePlaceholder")}
                      className={cn(
                        "pl-10 text-gray-900 placeholder:text-gray-400",
                        errors.message && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
                  </div>
                  {errorHint(errors.message)}
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
