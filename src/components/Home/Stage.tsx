"use client";
import { useTranslation } from "react-i18next";

export default function Stage() {
  const { t } = useTranslation();

  const steps = [
    { num: "01", titleKey: "home.stage.s1title", desc: ["home.stage.s1d1", "home.stage.s1d2", "home.stage.s1d3"] },
    { num: "02", titleKey: "home.stage.s2title", desc: ["home.stage.s2d1", "home.stage.s2d2", "home.stage.s2d3"] },
    { num: "03", titleKey: "home.stage.s3title", desc: ["home.stage.s3d1", "home.stage.s3d2", "home.stage.s3d3"] },
    { num: "04", titleKey: "home.stage.s4title", desc: ["home.stage.s4d1", "home.stage.s4d2", "home.stage.s4d3"] },
    { num: "05", titleKey: "home.stage.s5title", desc: ["home.stage.s5d1", "home.stage.s5d2"] },
  ];

  return (
    <section className="py-24" style={{ backgroundColor: "var(--axis-black)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="font-heading text-3xl md:text-4xl text-center mb-16" style={{ color: "var(--axis-white)" }}>
          {t("home.stage.title")}
        </h2>
        <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-4">
          {steps.map((step) => (
            <div key={step.num}
              className="flex-shrink-0 w-[280px] rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 group"
              style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(255,69,0,0.2)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,69,0,0.5)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 40px rgba(255,69,0,0.1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,69,0,0.2)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              <div className="text-4xl font-bold mb-4 opacity-30" style={{ color: "var(--axis-orange)" }}>{step.num}</div>
              <h3 className="text-base font-semibold mb-4 leading-snug" style={{ color: "var(--axis-white)" }}>
                {t(step.titleKey)}
              </h3>
              <ul className="space-y-2">
                {step.desc.map((key) => (
                  <li key={key} className="flex items-start gap-2 text-sm" style={{ color: "var(--axis-gray)" }}>
                    <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--axis-orange)" }} />
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
