"use client";
import React from "react";
import { useSearchParams } from "next/navigation";
const pages = () => {
  const mode = process.env.NEXT_PUBLIC_DEPLOY_MODE;

  const searchParams = useSearchParams();
  const manufacture = searchParams.get("manufacture");
  // console.log(manufacture); //здесь приняли параметр  теперь надо его прокинуть в iframe
  return (
    <div className="min-h-screen ">
      {" "}
      <iframe
        src={
          mode === "production"
            ? "https://carnex.vercel.app/"
            : `http://localhost:5173?manufacture=${manufacture}`
        }
        className="w-full min-h-screen "
        loading="lazy"
        title="Каталог"
      />{" "}
    </div>
  );
};

export default pages;
