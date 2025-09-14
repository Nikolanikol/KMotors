import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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

  kia;
  return (
    <div className="h-[70vh] bg-gradient-orange pt-10">
      <div className="flex flex-col justify-center gap-30">
        <h2 className="heading-2 text-center">Brands</h2>
        <div className="carouselwrapper  min-h-24 ">
          <Carousel orientation="horizontal" className="px-5">
            <CarouselContent className="flex gap-x-3 py-4 px-3">
              {logoArray.map(({ logo, name, action }, index) => (
                <Link
                  className="basis-1/4 shrink-0  rounded-2xl shadow-2xl flex items-center justify-center py-2 px-4 bg-white hover:scale-105 transition-all duration-300"
                  key={index}
                  href={{
                    pathname: "/catalog",
                    query: { manufacture: action },
                  }}
                >
                  {" "}
                  <BrandCard logo={logo} name={name} />
                </Link>
              ))}
            </CarouselContent>
            <div>
              <CarouselPrevious />
              <CarouselNext />
            </div>
          </Carousel>
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
    <CarouselItem className="flex justify-center pl-0 text-center">
      <div className="flex flex-col gap-2 items-center justify-between  ">
        <Image height={150} src={logo} alt="logo" />
        <h4 className="font-bold text-xl">{name}</h4>
      </div>
    </CarouselItem>
  );
};
