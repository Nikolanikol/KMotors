"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateNumbersArray } from "@/utils/generateNumbersArray";

const priceOptions = generateNumbersArray(1980, 2025, 1);
const MyFilterYear = ({
  setYear,
  defaultMin,
  defaultMax,
}: {
  setYear: React.Dispatch<React.SetStateAction<{ minYear: string; maxYear: string }>>;
  defaultMin?: string;
  defaultMax?: string;
}) => {
  const { t } = useTranslation();
  const [minPrice, setMinPrice] = useState(
    defaultMin ? Number(defaultMin) : priceOptions[0]
  );
  const [maxPrice, setMaxPrice] = useState(
    defaultMax ? Number(defaultMax) : priceOptions[priceOptions.length - 1]
  );

  const filteredFromOptions = priceOptions.filter(
    (option) => option <= maxPrice
  );

  const filteredToOptions = priceOptions.filter((option) => option >= minPrice);

  const handleminPriceChange = (string: string) => {
    const newminPrice = Number(string);
    setMinPrice(newminPrice);
    setYear((state) => {
      return { ...state, minYear: newminPrice.toString() };
    });
    if (newminPrice > maxPrice) {
      setMaxPrice(newminPrice);
    }
  };
  const handlemaxPriceChange = (number: string) => {
    const newmaxPrice = Number(number);
    setMaxPrice(newmaxPrice);
    setYear((state) => {
      return { ...state, maxYear: newmaxPrice.toString() };
    });
    if (newmaxPrice < minPrice) {
      setMinPrice(newmaxPrice);
    }
  };

  return (
    <>
      <h2 className="text-left my-3 font-bold">{t('filter.year')}</h2>

      <div className="flex gap-2">
        <Select
          onValueChange={handleminPriceChange}
          value={minPrice.toString()}
        >
          <SelectTrigger className="flex-1 min-w-0">
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{minPrice}</SelectLabel>{" "}
              <div className="max-h-80 overflow-y-scroll">
                {filteredFromOptions.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
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
          <SelectTrigger className="flex-1 min-w-0">
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{maxPrice}</SelectLabel>{" "}
              <div className="max-h-80 overflow-y-scroll">
                {filteredToOptions.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
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

export default MyFilterYear;
