"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { ICar } from "./dataType";
import CarCard from "./CarCard";

export default function AutoSlider({ data }: { data: ICar[] }) {
  return (
    <Swiper
      modules={[Autoplay, Pagination]} // 👈 обязательно!
      spaceBetween={10}
      autoplay={{
        delay: 3000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      }}
      pagination={{ clickable: true }}
      navigation={true}
      loop={true}
      className="py-10 px5 h-[570px]"
      initialSlide={0}
      breakpoints={{
        320: { slidesPerView: 1 },
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
        1440: { slidesPerView: 4 },
      }}
    >
      {data &&
        data.map((item, i) => (
          <SwiperSlide className="h-[400px]">
            {" "}
            <CarCard
              id={item.Id}
              manufacture={item.Manufacturer}
              photo={item.Photos[0].location}
              model={item.Model}
              year={item.FormYear}
              mileage={item.Mileage}
              transmission={item.Transmission}
              fuel={item.FuelType}
              price={item.Price}
            />{" "}
          </SwiperSlide>
        ))}
    </Swiper>
  );
}
