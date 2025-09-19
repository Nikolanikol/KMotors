"use client";

import React from "react";

import Image, { StaticImageData } from "next/image";
import kia from "./logo/kia.webp";
import audi from "./logo/audi.webp";
import bmw from "./logo/bmw.webp";
import chevrolet from "./logo/chevrolet.webp";
import hyundai from "./logo/hyundai.webp";
import mercedesBenz from "./logo/mercedes-benz.webp";
import porsche from "./logo/porsche.webp";

import ssangyong from "./logo/ssangyong.webp";
import renaultSamsung from "./logo/renault-samsung.webp";
import Link from "next/link";

import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
const Brands = () => {
  const logoArray: { logo: StaticImageData; name: string; action: string }[] = [
    {
      logo: kia,
      name: "Kia",
      action: "(And.Hidden.N._.(C.CarType.Y._.Manufacturer.기아.))",
    },
    {
      logo: audi,
      name: "Audi",
      action: "(And.Hidden.N._.(C.CarType.N._.Manufacturer.아우디.))",
    },
    {
      logo: bmw,
      name: "BMW",
      action: "(And.Hidden.N._.(C.CarType.N._.Manufacturer.BMW.))",
    },
    {
      logo: chevrolet,
      name: "Chevrolet",
      action: "(And.Hidden.N._.(C.CarType.Y._.Manufacturer.쉐보레(GM대우_).))",
    },
    {
      logo: hyundai,
      name: "Hyundai",
      action: "(And.Hidden.N._.(C.CarType.Y._.Manufacturer.현대.))",
    },
    {
      logo: mercedesBenz,
      name: "Mercedes-Benz",
      action: "(And.Hidden.N._.(C.CarType.N._.Manufacturer.벤츠.))",
    },
    {
      logo: porsche,
      name: "Porsche",
      action: "(And.Hidden.N._.(C.CarType.N._.Manufacturer.포르쉐.)) ",
    },
    {
      logo: ssangyong,
      name: "SsangYong",
      action:
        "(And.Hidden.N._.(C.CarType.Y._.Manufacturer.KG모빌리티(쌍용_).))",
    },
    {
      logo: renaultSamsung,
      name: "Renault Samsung",
      action:
        "(And.Hidden.N._.(C.CarType.Y._.Manufacturer.르노코리아(삼성_).))",
    },
  ];

  return (
    <div className="h-[70vh] bg-gradient-orange pt-10">
      <div className="flex flex-col justify-center gap-30">
        <h2 className="heading-2 text-center">Brands</h2>
        <div className="carouselwrapper  min-h-24 px-5">
          <Swiper
            modules={[Autoplay, Pagination]} // 👈 обязательно!
            spaceBetween={20}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            pagination={{ clickable: true }}
            navigation={true}
            loop={true}
            className="py-10 px5 h-[300px]"
            initialSlide={0}
            breakpoints={{
              320: { slidesPerView: 1 },
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
              1440: { slidesPerView: 4 },
            }}
          >
            {logoArray.map(({ logo, name, action }, index) => (
              <SwiperSlide key={index} className="h-[200px]">
                <div className="p-5">
                  <Link
                    className="basis-1/3 shrink-0  rounded-2xl shadow-2xl flex items-center justify-center py-2 px-4 bg-white hover:scale-105 transition-all duration-300"
                    key={index}
                    href={{
                      pathname: "/catalog",
                      query: { manufacture: action },
                    }}
                  >
                    {" "}
                    <BrandCard logo={logo} name={name} />
                  </Link>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
};

export default Brands;

interface BrandCardProps {
  logo: StaticImageData;
  name: string;
}
const BrandCard = ({ logo, name }: BrandCardProps) => {
  return (
    <div className="flex justify-center pl-0 text-center">
      <div className="flex flex-col gap-2 items-center justify-between  ">
        <Image height={150} src={logo} alt="logo" />
        <h4 className="font-bold text-xl">{name}</h4>
      </div>
    </div>
  );
};
