"use client";
import { generateNumbersArray } from "@/utils/generateNumbersArray";
import { convertNumberKm } from "@/utils/splitNumber";

import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const priceOptions = generateNumbersArray(0, 200000, 10000);

const MyFilterMileage = ({
  setMileage,
}: {
  setMileage: React.Dispatch<
    React.SetStateAction<{ minMileage: string; maxMileage: string }>
  >;
}) => {
  const [minPrice, setMinPrice] = useState(priceOptions[0]);
  const [maxPrice, setMaxPrice] = useState(
    priceOptions[priceOptions.length - 1]
  );
  const filteredFromOptions = priceOptions.filter(
    (option) => option <= maxPrice
  );

  const filteredToOptions = priceOptions.filter((option) => option >= minPrice);
  const handleminPriceChange = (string: string) => {
    const newminPrice = Number(string);
    setMinPrice(newminPrice);
    setMileage((state) => {
      return { ...state, minMileage: newminPrice.toString() };
    });
    if (newminPrice > maxPrice) {
      setMaxPrice(newminPrice);
    }
  };
  const handlemaxPriceChange = (string: string) => {
    const newmaxPrice = Number(string);
    setMaxPrice(newmaxPrice);
    setMileage((state) => {
      return { ...state, maxMileage: newmaxPrice.toString() };
    });
    if (newmaxPrice < minPrice) {
      setMinPrice(newmaxPrice);
    }
  };
  return (
    <>
      <h2 className="text-left my-3 font-bold">Пробег</h2>

      <div className="flex justify-between">
        <Select
          onValueChange={handleminPriceChange}
          value={minPrice.toString()}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{convertNumberKm(minPrice)} км</SelectLabel>{" "}
              <div className="max-h-80 overflow-y-scroll">
                {filteredFromOptions.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {convertNumberKm(option)} км
                  </SelectItem>
                ))}
              </div>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          onValueChange={handlemaxPriceChange}
          value={maxPrice.toString()}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{convertNumberKm(maxPrice)} км</SelectLabel>{" "}
              <div className="max-h-80 overflow-y-scroll">
                {filteredToOptions.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {convertNumberKm(option)} км
                  </SelectItem>
                ))}
              </div>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full bg-gray-500 h-0.5 mt-7"></div>
    </>
  );
};

export default MyFilterMileage;
