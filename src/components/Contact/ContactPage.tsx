"use client";

import Form from "./Form";
import { useTranslation } from "react-i18next";

export default function ContactPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--axis-black)" }}>
      <div className="max-w-xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--axis-white)" }}>{t('contact.title')}</h1>
        <p className="mb-8 text-sm" style={{ color: "var(--axis-gray)" }}>
          {t('contact.pageDescription', {
            defaultValue: 'Хотите узнать больше о корейских автомобилях или получить персональный подбор? Заполните форму ниже — мы свяжемся с вами в ближайшее время.'
          })}
        </p>
        <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}>
          <Form />
        </div>
      </div>
    </div>
  );
}
