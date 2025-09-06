import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";

const Main = () => {
  return (
    <div className="min-h-[70vh] aurora-bg">
      <div className="wrapper text-center md:pt-[10%] heading-3 pt-[40%] md:heading-2">
        <h2 className="md:heading-2 max-w-full overflow-hidden">
          Найди автомобиль <br /> своей мечты
        </h2>
        <p className="text-lg mb-6"> Из Кореи в любую точку мира!</p>
        <Button size="lg" className=" text-3xl">
          {" "}
          <Link href="/catalog">каталог</Link>
        </Button>
      </div>
    </div>
  );
};

export default Main;
