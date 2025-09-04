import React from "react";

const pages = () => {
  return (
    <div className="min-h-screen border-2 border-black">
      {" "}
      <iframe
        src="https://carnex.vercel.app/"
        className="w-full min-h-screen border-black border-2"
        loading="lazy"
        title="Каталог"
      />{" "}
    </div>
  );
};

export default pages;
