"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { ICar } from "./dataType";
import CarCard from "./CarCard";

interface AutoSliderProps {
  data: ICar[];
  krwToRub: number;
  krwToUsd: number;
}

export default function AutoSlider({ data, krwToRub, krwToUsd }: AutoSliderProps) {
  return (
    <Swiper
      modules={[Autoplay, Pagination]} // 👈 обязательно!
      spaceBetween={10}
      autoplay={{
        delay: 3000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      }}
      // pagination={{ clickable: true }}
      navigation={true}
      loop={true}
      className="py-10 px5 h-[570px] text-center"
      initialSlide={0}
      breakpoints={{
        320: { slidesPerView: 1 },
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
        1440: { slidesPerView: 3 },
      }}
    >
      {/* ⚠️ Фото читается через опциональную цепочку: у части объявлений Encar
          фотографий нет вовсе, и прежнее item.Photos[0].location роняло ВЕСЬ
          слайдер целиком (найдено в логах дев-сервера 23.08.2026). Соседи по коду —
          CarsRow и SoldCar — давно читают фото так же, а CarCard принимает photo
          необязательным пропом и сам показывает заглушку. */}
      {data &&
        data.map((item, i) => (
          <SwiperSlide key={i} className="h-[400px] ">
            {" "}
            <CarCard
              id={item.Id}
              manufacture={item.Manufacturer}
              photo={item.Photos?.[0]?.location}
              model={item.Model}
              year={item.FormYear}
              mileage={item.Mileage}
              transmission={item.Transmission}
              fuel={item.FuelType}
              price={item.Price}
              krwToRub={krwToRub}
              krwToUsd={krwToUsd}
              priority={i < 2}
            />{" "}
          </SwiperSlide>
        ))}
    </Swiper>
  );
}
