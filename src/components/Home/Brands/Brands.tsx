"use client";
import React from "react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { useTranslation } from "react-i18next";
import { logoArray } from "./data";

const Brands = () => {
  const { t } = useTranslation();

  return (
    <div className="py-16" style={{ backgroundColor: "var(--axis-charcoal)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="font-heading text-3xl md:text-4xl text-center mb-10" style={{ color: "var(--axis-white)" }}>
          {t("home.brands.title")}
        </h2>
        <Swiper
          modules={[Autoplay, Pagination]}
          spaceBetween={16}
          autoplay={{ delay: 2500, disableOnInteraction: false, pauseOnMouseEnter: true }}
          pagination={{ clickable: true }}
          loop={true}
          className="pb-10"
          breakpoints={{ 320: { slidesPerView: 2 }, 640: { slidesPerView: 3 }, 1024: { slidesPerView: 4 }, 1440: { slidesPerView: 5 } }}
        >
          {logoArray.map(({ logo, name, action }, index) => (
            <SwiperSlide key={index}>
              <div className="p-2">
                <Link
                  href={{ pathname: "/catalog", query: { action } }}
                  className="flex items-center justify-center py-4 px-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 group"
                  style={{ backgroundColor: "var(--axis-graphite)", border: "1px solid rgba(74,74,74,0.3)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,69,0,0.4)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(255,69,0,0.1)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(74,74,74,0.3)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="bg-white rounded-xl p-2 flex items-center justify-center">
                      <Image height={60} src={logo} alt={`${name} — Korean car brand`} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: "var(--axis-gray)" }}>{name}</span>
                  </div>
                </Link>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default Brands;

interface BrandCardProps { logo: StaticImageData; name: string; }
const BrandCard = ({ logo, name }: BrandCardProps) => (
  <div className="flex flex-col gap-2 items-center justify-between">
    <Image height={150} src={logo} alt={`${name} — Korean car brand`} />
    <h4 className="font-bold text-xl">{name}</h4>
  </div>
);
