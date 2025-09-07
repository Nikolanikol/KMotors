import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";
import clsx from "clsx";

const Main = () => {
  return (
    <div className="min-h-[70vh] aurora-bg">
      <div className="wrapper text-center md:pt-[10%] heading-3 pt-[40%] md:heading-2">
        <h2 className="md:heading-2 max-w-full overflow-hidden">
          Найди автомобиль <br /> своей мечты
        </h2>
        <p className="text-lg mb-6"> Из Кореи в любую точку мира!</p>

        <SlidingButton>
          {" "}
          <Link className="block" href="/catalog">
            каталог
          </Link>
        </SlidingButton>
      </div>
    </div>
  );
};

export default Main;
const SlidingButton = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <button
      className={clsx(
        "relative cursor-pointer overflow-hidden group w-48 h-12 rounded-md text-white font-semibold",
        className
      )}
      {...props} // ← здесь передаются все остальные пропсы
    >
      {/* Нижний слой */}
      <div className="absolute inset-0 bg-orange-700" />

      {/* Верхний слой */}
      <div className="absolute inset-0 bg-orange-500 transition-transform duration-300 ease-in-out group-hover:translate-x-full" />

      {/* Текст поверх слоёв */}
      <span className="relative z-10">{children}</span>
    </button>
  );
};
