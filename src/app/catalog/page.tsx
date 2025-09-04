"use client";
import React from "react";

const pages = () => {
  const mode = process.env.NEXT_PUBLIC_DEPLOY_MODE;
  return (
    <div className="min-h-screen ">
      {" "}
      <iframe
        src={
          mode === "production"
            ? "https://carnex.vercel.app/"
            : "http://localhost:5173/"
        }
        className="w-full min-h-screen "
        loading="lazy"
        title="Каталог"
      />{" "}
    </div>
  );
};

export default pages;
