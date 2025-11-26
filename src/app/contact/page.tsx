"use client";

import ContactForm from "@/components/Contact/Form";
import { useTranslation } from "react-i18next";
import React from "react";

const ContactPage = () => {
  const { t } = useTranslation();

  return (
    <div className=" pt-4 relative min-h-[70vh] w-screen bg-[url('/images/map.png')] ">
      <div className="row flex flex-col gap-y-5 px-4 py-4 md:absolute md:-bottom-10 md:right-10 z-10 bg-white  rounded-2xl shadow-2xl">
        <div>
          <h2 className="md:heading-2 font-bold text-4xl ">
            {t('contact.formTitle')} <span className="text-red-600">{t('contact.formTitleHighlight')}</span>{" "}
          </h2>{" "}
          <p className="desc uppercase max-w-100">
            {t('contact.formSubtitle')}
          </p>{" "}
        </div>
        <ContactForm />{" "}
      </div>
    </div>
  );
};

export default ContactPage;
