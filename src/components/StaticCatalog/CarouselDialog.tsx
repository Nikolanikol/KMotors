"use client";

import { useState } from "react";

import { SlidingButton } from "@/components/ui/button";
import { Dialog, DialogTitle, DialogContent } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";

export default function CarouselDialog({
  images,
  isVisible,
}: {
  isVisible?: boolean;
  images: string[];
}) {
  const [visible, setVisible] = useState(isVisible);

  //   const [loading, setLoading] = useState(false);
  //   const [success, setSuccess] = useState(false);

  //   const [form, setForm] = useState({
  //     name: "",
  //     phone: "",
  //     email: "",
  //     message: "",
  //     method: "",
  //   });

  //   const handleChange = (
  //     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  //   ) => {
  //     setForm({ ...form, [e.target.name]: e.target.value });
  //   };

  //   const handleSubmit = async (e: React.FormEvent) => {
  //     e.preventDefault();
  //     setLoading(true);
  //     setSuccess(false);

  //     const res = await fetch("/api/contact", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(form),
  //     });

  //     setLoading(false);
  //     if (res.ok) {
  //       setSuccess(true);
  //       setForm({ name: "", phone: "", email: "", message: "", method: "" });
  //     } else {
  //       alert("Ошибка при отправке");
  //     }
  //   };

  return (
    <div className="max-w-md ">
      <SlidingButton
        className="w-full h-full"
        onClick={() => setVisible(!visible)}
      >
        <Image src={images[0]} alt="car image" />
        {/* {visible ? "Скрыть форму" : "показать галерею"} */}
      </SlidingButton>

      {visible && (
        <Dialog open={visible} onOpenChange={setVisible}>
          <DialogTitle></DialogTitle>
          <DialogContent className="max-w-[70vw] max-h-[80vh] p-0 rounded-xl">
            <Carousel type="catalog">
              <CarouselContent className="">
                {images.map((img: string, index: number) => (
                  <CarouselItem
                    key={index}
                    className="flex justify-center items-center "
                  >
                    <Image
                      className="w-auto h-auto min-h-[70vh] min-w-[90vw]: max-h-[400px] object-contain"
                      src={img}
                      alt={`car image ${index + 1}`}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="top-0 hover:bg-amber-500 left-0 h-full z-20  w-5 md:w-8 border-r-0 rounded-tr-none rounded-br-none" />
              <CarouselNext className="top-0 left-full hover:bg-amber-500 h-full w-5 md:w-8 border-l-0 rounded-tl-none z-20 rounded-bl-none" />
            </Carousel>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
