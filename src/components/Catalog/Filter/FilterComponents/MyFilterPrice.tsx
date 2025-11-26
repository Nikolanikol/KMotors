"use client";
import { SetStateAction, useState } from "react";
import { useTranslation } from "react-i18next";
import { convertNumber } from "@/utils/splitNumber";
import { generateNumbersArray } from "@/utils/generateNumbersArray";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const priceOptions = generateNumbersArray(0, 10000, 100);
const MyFilterPrice = ({
  setPrice,
}: {
  setPrice: React.Dispatch<
    SetStateAction<{ minPrice: string; maxPrice: string }>
  >;
}) => {
  const { t } = useTranslation();
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
    setPrice((state) => {
      return { ...state, minPrice: newminPrice.toString() };
    });
    if (newminPrice > maxPrice) {
      setMaxPrice(newminPrice);
    }
  };
  const handlemaxPriceChange = (number: string) => {
    const newmaxPrice = Number(number);
    setMaxPrice(newmaxPrice);
    setPrice((state) => {
      return { ...state, maxPrice: newmaxPrice.toString() };
    });
    if (newmaxPrice < minPrice) {
      setMinPrice(newmaxPrice);
    }
  };

  return (
    <>
      <h2 className="text-left my-3 font-bold">{t('filter.price')}</h2>

      <div className="flex justify-between">
        <Select
          onValueChange={handleminPriceChange}
          value={minPrice.toString()}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup defaultValue={"a"}>
              <SelectLabel>{convertNumber(minPrice)} {t('common.won')}</SelectLabel>{" "}
              <div className="max-h-80 overflow-y-scroll">
                {filteredFromOptions.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {convertNumber(option)} {t('common.won')}
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
              <SelectLabel>{convertNumber(maxPrice)} {t('common.won')}</SelectLabel>{" "}
              <div className="max-h-80 overflow-y-scroll">
                {filteredToOptions.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {convertNumber(option)} {t('common.won')}
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

export default MyFilterPrice;
