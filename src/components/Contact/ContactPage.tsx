"use client";

import Form from "./Form";
import { useTranslation } from "react-i18next";

export default function ContactPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">{t('contact.title')}</h1>
      <p className="mb-6 text-gray-700">
        {t('contact.pageDescription', {
          defaultValue: 'Хотите узнать больше о корейских автомобилях или получить персональный подбор? Заполните форму ниже — мы свяжемся с вами в ближайшее время.'
        })}
      </p>
      <Form />
    </div>
  );
}
