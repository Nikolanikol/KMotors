"use client";
import { useState, useEffect, useRef } from "react";
import { type Value } from "react-phone-number-input";
import { X, Package, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { trackEvent } from "@/utils/gtag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { MessengerSelector } from "@/components/ui/MessengerSelector";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  partNumber: string;
  productUrl: string;
  priceText?: string;
  categoryName?: string;
  /** Lead source label sent to Telegram (defaults to product order). */
  source?: string;
  /** Modal title / intent — e.g. fitment check. */
  title?: string;
  subtitle?: string;
  /** Full custom message body (e.g. whole cart composition). Overrides the single-product lines. */
  messageLines?: string[];
}

function projectLabel(): string {
  try {
    const host = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.kmotors.shop").host.replace(/^www\./, "");
    const name = host.split(".")[0];
    return `${name.charAt(0).toUpperCase()}${name.slice(1)} (${host})`;
  } catch {
    return "KMotors (kmotors.shop)";
  }
}

export function OrderModal({
  isOpen,
  onClose,
  productName,
  partNumber,
  productUrl,
  priceText,
  categoryName,
  source = "parts_product",
  title,
  subtitle,
  messageLines,
}: OrderModalProps) {
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState<Value | undefined>();
  const [messenger, setMessenger] = useState("whatsapp");
  const [tgUsername, setTgUsername] = useState("");
  const [vin, setVin] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);

  // Focus first field when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const errors = {
    name: attempted && !name.trim(),
    phone: attempted && !phone,
    tg: attempted && messenger === "telegram" && !tgUsername.trim(),
  };

  const isValid =
    name.trim() &&
    !!phone &&
    (messenger !== "telegram" || tgUsername.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (!isValid) return;

    setLoading(true);
    try {
      const message = (messageLines && messageLines.length
        ? [`🏷 Проект: ${projectLabel()}`, ...messageLines]
        : [
            `🏷 Проект: ${projectLabel()}`,
            `🔧 Деталь: ${productName}`,
            `🔢 № по каталогу: ${partNumber}`,
            priceText ? `💵 Цена: ${priceText}` : "",
            categoryName ? `📂 Категория: ${categoryName}` : "",
            `🔗 ${productUrl}`,
          ]
      ).filter(Boolean).join("\n");
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone ?? "",
          messenger,
          tg_username: tgUsername.trim() || undefined,
          vin: vin.trim() || undefined,
          message,
          source,
        }),
      });
      if (!res.ok) throw new Error("Send error");
      trackEvent("generate_lead", { source, part_number: partNumber });
      setSuccess(true);
    } catch {
      // keep modal open so user can retry
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // reset after animation
    setTimeout(() => {
      setName("");
      setPhone(undefined);
      setMessenger("whatsapp");
      setTgUsername("");
      setVin("");
      setSuccess(false);
      setAttempted(false);
    }, 200);
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-md bg-[#1c1b1b] border border-[#333] rounded-2xl shadow-2xl overflow-hidden text-[#e6e2e0]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#141414] border-b border-[#333] px-6 py-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {(title || subtitle) && (
              <p className="text-[#ff7a00] text-[11px] font-bold uppercase tracking-wider mb-1.5">{title}</p>
            )}
            <p className="text-[#a5a09c] text-xs mb-0.5 font-mono">{t("parts.order.partNumber")}: {partNumber}</p>
            <h2 className="text-white font-bold text-lg leading-snug line-clamp-2">{productName}</h2>
            {subtitle && <p className="text-[#a5a09c] text-xs mt-1.5 leading-snug">{subtitle}</p>}
          </div>
          <button
            onClick={handleClose}
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[#a5a09c] hover:text-white hover:bg-white/10 transition-colors mt-0.5"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {success ? (
            /* Success state */
            <div className="flex flex-col items-center text-center py-6 gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-green-400" />
              </div>
              <div>
                <p className="text-white font-bold text-xl mb-1">{t("parts.order.successTitle")}</p>
                <p className="text-[#a5a09c] text-sm">{t("parts.order.successDesc")}</p>
              </div>
              <Button
                onClick={handleClose}
                className="bg-[#ff7a00] hover:brightness-110 text-white mt-2 px-8"
              >
                {t("parts.order.closeBtn")}
              </Button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* Product chip */}
              <div className="flex items-center gap-2 bg-[#201f1f] border border-[#333] rounded-xl px-3 py-2.5">
                <Package className="w-4 h-4 text-[#ff7a00] shrink-0" />
                <span className="text-xs text-[#e6e2e0] font-medium truncate">{t("parts.order.orderingPart")}: {partNumber}</span>
                {priceText && <span className="ml-auto text-xs font-bold text-[#ff7a00]">{priceText}</span>}
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="order-name" className="text-sm font-medium text-[#e6e2e0]">
                  {t("parts.order.nameLabel")} <span className="text-[#ff7a00]">*</span>
                </Label>
                <Input
                  id="order-name"
                  ref={nameRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("parts.order.namePlaceholder")}
                  className={`text-[#e6e2e0] placeholder:text-[#6f6b68] border-[#333] bg-[#201f1f] ${errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
                {errors.name && (
                  <p className="text-xs text-red-400">{t("parts.order.nameRequired")}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#e6e2e0]">
                  {t("parts.order.phoneLabel")} <span className="text-[#ff7a00]">*</span>
                </Label>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  placeholder={t("parts.order.phonePlaceholder")}
                  required
                  error={errors.phone}
                  className="text-[#e6e2e0] placeholder:text-[#6f6b68]"
                />
                {errors.phone && (
                  <p className="text-xs text-red-400">{t("parts.order.phoneRequired")}</p>
                )}
              </div>

              {/* Messenger */}
              <MessengerSelector
                messenger={messenger}
                onMessengerChange={setMessenger}
                tgUsername={tgUsername}
                onTgUsernameChange={setTgUsername}
                label={t("parts.order.messengerLabel")}
                usernamePlaceholder="@username"
              />
              {errors.tg && (
                <p className="text-xs text-red-400 -mt-2">{t("parts.order.tgRequired")}</p>
              )}

              {/* VIN (optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="order-vin" className="text-sm font-medium text-[#e6e2e0]">
                  {t("parts.order.vinLabel")}
                  <span className="text-[#6f6b68] font-normal ml-1">({t("parts.order.optional")})</span>
                </Label>
                <Input
                  id="order-vin"
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  placeholder="KMHXX00XXXX000000"
                  className="font-mono text-sm tracking-wider text-[#e6e2e0] placeholder:text-[#6f6b68] border-[#333] bg-[#201f1f]"
                  maxLength={17}
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#ff7a00] hover:brightness-110 text-white font-semibold text-base mt-2"
              >
                {loading ? t("parts.order.sending") : t("parts.order.submitBtn")}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
