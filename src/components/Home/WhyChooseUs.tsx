"use client";
import { useTranslation } from "react-i18next";

const ICONS = [
  <svg key="1" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <defs><linearGradient id="wcu1" x1="0" y1="0" x2="48" y2="48"><stop offset="0%" stopColor="#FF4500"/><stop offset="100%" stopColor="#FF8C00"/></linearGradient></defs>
    <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" fill="url(#wcu1)" strokeWidth="0.5"/>
    <path d="M18 24l6 6 10-10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
  <svg key="2" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <defs><linearGradient id="wcu2" x1="0" y1="0" x2="48" y2="48"><stop offset="0%" stopColor="#FF4500"/><stop offset="100%" stopColor="#FF8C00"/></linearGradient></defs>
    <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" fill="url(#wcu2)" strokeWidth="0.5"/>
    <circle cx="24" cy="22" r="6" stroke="white" strokeWidth="2.5" fill="none"/>
    <path d="M24 16v6l4 2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>,
  <svg key="3" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <defs><linearGradient id="wcu3" x1="0" y1="0" x2="48" y2="48"><stop offset="0%" stopColor="#FF4500"/><stop offset="100%" stopColor="#FF8C00"/></linearGradient></defs>
    <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" fill="url(#wcu3)" strokeWidth="0.5"/>
    <rect x="14" y="20" width="20" height="12" rx="2" stroke="white" strokeWidth="2" fill="none"/>
    <circle cx="18" cy="32" r="3" stroke="white" strokeWidth="2" fill="none"/>
    <circle cx="30" cy="32" r="3" stroke="white" strokeWidth="2" fill="none"/>
  </svg>,
];

export default function WhyChooseUs() {
  const { t } = useTranslation();

  const features = [
    { icon: ICONS[0], title: t("home.why.f1title"), description: t("home.why.f1desc") },
    { icon: ICONS[1], title: t("home.why.f2title"), description: t("home.why.f2desc") },
    { icon: ICONS[2], title: t("home.why.f3title"), description: t("home.why.f3desc") },
  ];

  return (
    <section className="py-24 md:py-32" style={{ backgroundColor: "var(--axis-charcoal)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="font-heading text-3xl md:text-4xl text-center mb-16" style={{ color: "var(--axis-white)" }}>
          {t("home.why.title")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 cursor-default"
              style={{ backgroundColor: "var(--axis-graphite)", border: "1px solid rgba(255,69,0,0.2)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,69,0,0.5)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 40px rgba(255,69,0,0.15)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,69,0,0.2)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              <div className="mb-6">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: "var(--axis-white)" }}>{feature.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--axis-gray)" }}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
