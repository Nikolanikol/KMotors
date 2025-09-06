"use client";
import ContactForm from "@/components/Contact/Form";
import Image from "next/image";

import React from "react";

const pages = () => {
  return (
    <div className=" pt-4 relative min-h-[70vh] w-screen bg-[url('/images/map.png')] ">
      <div className="row flex flex-col gap-y-5 px-4 py-4 md:absolute md:-bottom-10 md:right-10 z-10 bg-white  rounded-2xl shadow-2xl">
        <div>
          <h2 className="md:heading-2 font-bold text-4xl ">
            ЗАПОЛНИТЕ <span className="text-red-600">ЗАЯВКУ</span>{" "}
          </h2>{" "}
          <p className="desc uppercase max-w-100">
            и в ближайшее время с вами свяжется наш менеджер
          </p>{" "}
        </div>
        <ContactForm />{" "}
      </div>
    </div>
  );
};

export default pages;
