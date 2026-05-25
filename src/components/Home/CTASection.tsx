"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trackEvent } from "@/utils/gtag";

export default function CTASection() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || loading) return;
    setLoading(true);
    try {
      await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "CTA форма", phone, source: "header" }),
      });
    } catch {}
    setLoading(false);
    setSubmitted(true);
    setPhone("");
    trackEvent("generate_lead", { source: "cta_main" });
  };

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0" style={{ backgroundColor: "var(--axis-black)" }}>
        <div className="absolute inset-0 opacity-20" style={{
          background: "radial-gradient(ellipse at 50% 50%, var(--axis-orange) 0%, transparent 70%)",
        }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="font-heading text-3xl md:text-4xl mb-4" style={{ color: "var(--axis-white)" }}>
          {t("cta.title")}
        </h2>
        <p className="mb-10 leading-relaxed" style={{ color: "var(--axis-gray)" }}>
          {t("cta.subtitle")}
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("cta.placeholder")}
              required
              className="flex-1 px-6 py-4 rounded-full focus:outline-none transition-colors"
              style={{
                backgroundColor: "transparent",
                border: "1px solid rgba(74,74,74,0.5)",
                color: "var(--axis-white)",
              }}
              onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--axis-orange)"; }}
              onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(74,74,74,0.5)"; }}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 font-semibold rounded-full transition-all duration-300 whitespace-nowrap flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--axis-orange)", color: "white" }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--axis-orange-bright)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--axis-orange)"; }}
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? t("cta.submitting") : t("cta.submit")}
            </button>
          </form>
        ) : (
          <div className="px-8 py-4 rounded-full font-semibold inline-block"
            style={{ backgroundColor: "rgba(255,69,0,0.15)", border: "1px solid rgba(255,69,0,0.4)", color: "var(--axis-orange)" }}>
            {t("cta.thanks")}
          </div>
        )}
      </div>
    </section>
  );
}
