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

const Brands = () => {
  const logoArray: { logo: StaticImageData; name: string }[] = [
    { logo: kia, name: "Kia" },
    { logo: audi, name: "Audi" },
    { logo: bmw, name: "BMW" },
    { logo: chevrolet, name: "Chevrolet" },
    { logo: hyundai, name: "Hyundai" },
    { logo: mercedesBenz, name: "Mercedes-Benz" },
    { logo: porsche, name: "Porsche" },
    { logo: ssangyong, name: "SsangYong" },
    { logo: renaultSamsung, name: "Renault Samsung" },
  ];

  kia;
  return (
    <div className="h-[70vh] bg-gradient-orange pt-10">
      <div className="flex flex-col justify-center gap-30">
        <h2 className="heading-2 text-center">Brands</h2>
        <div className="carouselwrapper  min-h-24 ">
          <Carousel>
            <CarouselContent className="flex gap-x-3 py-4">
              {logoArray.map(({ logo, name }, index) => (
                <BrandCard key={index} logo={logo} name={name} />
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
    <CarouselItem className="basis-1/4  rounded-2xl shadow-2xl flex items-center justify-center py-2 px-4 bg-white ">
      <div className="flex flex-col gap-2 items-center justify-between  ">
        <Image height={150} src={logo} alt="logo" />
        <h4 className="font-bold text-xl">{name}</h4>
      </div>
    </CarouselItem>
  );
};
