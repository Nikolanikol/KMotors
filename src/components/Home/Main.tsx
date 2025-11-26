"use client";

import Link from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";
import { SlidingButton } from "../ui/button";

const Main = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-[70vh] aurora-bg">
      <div className="wrapper text-center md:pt-[10%] heading-3 pt-[40%] md:heading-2">
        <h2 className="md:heading-2 max-w-full overflow-hidden">
          {t('home.hero.title')}
        </h2>
        <p className="text-lg mb-6">{t('home.hero.subtitle')}</p>

        <SlidingButton>
          <Link className="block" href="/catalog">
            {t('home.hero.catalogButton')}
          </Link>
        </SlidingButton>
      </div>
    </div>
  );
};

export default Main;
