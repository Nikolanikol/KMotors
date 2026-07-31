"use client";

import ContactForm from "@/components/Contact/Form";
import { useTranslation } from "react-i18next";
import React from "react";

const ContactPage = () => {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[70vh] w-full bg-[url('/images/map.png')] bg-cover bg-center bg-no-repeat">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 md:py-16 flex justify-center md:justify-end">
        <div className="w-full max-w-md flex flex-col gap-y-5 p-6 sm:p-8 bg-white rounded-2xl shadow-2xl">
          <div>
            {/* Карточка белая, а глобальный цвет текста — светлый axis-white: без
                явного тёмного цвета заголовок сливается с фоном карточки. */}
            <h1 className="md:heading-2 font-bold text-4xl text-[var(--axis-charcoal)]">
              {t('contact.formTitle')} <span className="text-[var(--axis-orange)]">{t('contact.formTitleHighlight')}</span>
            </h1>
            <p className="desc uppercase mt-2 text-sm text-[var(--axis-gray-dim)]">
              {t('contact.formSubtitle')}
            </p>
          </div>
          <ContactForm />
        </div>
      </div>
    </section>
  );
};

export default ContactPage;
