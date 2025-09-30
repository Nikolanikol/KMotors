"use client";
import React, { use, useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { data } from "./FilterData";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  fetchGeneration,
  fetchModels,
  GenerationResponce,
  ModelsResponce,
} from "./FilterService";
import MyFilterPrice from "./FilterComponents/MyFilterPrice";
import MyFilterMileage from "./FilterComponents/MyFilterMileage";
import MyFilterYear from "./FilterComponents/MyFilterYear";
import { Options } from "./FilterComponents/Types";

/*************  ✨ Windsurf Command ⭐  *************/

const Filter = ({}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  ///Filters
  const [manufactureAction, setManufactureAction] = useState<string | null>(
    null
  );
  const [modelActionDrill, setModelActionDrill] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);

  const handleAction = (value: string) => {
    // console.log(price);

    startTransition(() => {
      router.push(
        `/catalog?action=${value}&page=1&priceMin=${price.minPrice}&priceMax=${price.maxPrice}&mileageMin=${mileage.minMileage}&mileageMax=${mileage.maxMileage}&yearMin=${year.minYear}&yearMax=${year.maxYear}`
      );
    });
  };
  /////////////////////////////////
  const [price, setPrice] = useState({ minPrice: "", maxPrice: "" });
  const [mileage, setMileage] = useState({
    minMileage: "",
    maxMileage: "",
  });
  const [year, setYear] = useState({ minYear: "", maxYear: "" });
  return (
    <div className="flex flex-col gap-2">
      <h2>Производитель</h2>

      <Select
        value={manufactureAction}
        onValueChange={(e) => {
          setAction(e);
          setManufactureAction(e);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Производитель" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>Выберите Производителя</SelectItem>
          {data.map((item) => (
            <SelectItem key={item.Action} value={item.Action}>
              {item.DisplayValue}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* ///////////////////////////// Models Row */}
      <ModelsRow
        action={manufactureAction}
        setModelActionDrill={setModelActionDrill}
        setAction={setAction}
      />

      {/* ////////////////////////Generation */}
      <GenerationRow action={modelActionDrill} setAction={setAction} />

      <div>------------------</div>
      <MyFilterPrice setPrice={setPrice} />
      <MyFilterMileage setMileage={setMileage} />
      <MyFilterYear setYear={setYear} />
      {/* ///////////////////////////// */}
      <Button onClick={() => handleAction(action)}>Показать</Button>
      {isPending && (
        <div className="top-0 left-0 bottom-0 right-0 z-20 absolute bg-gray-300 opacity-30 border-2 border-black">
          ⏳ Обновляем...
        </div>
      )}
    </div>
  );
};

export default Filter;

interface ModelsRowProps {
  action: string | null;
  setAction: React.Dispatch<React.SetStateAction<string | null>>;
  setModelActionDrill: React.Dispatch<React.SetStateAction<string | null>>;
}
const ModelsRow: React.FC<ModelsRowProps> = ({
  action,
  setAction,
  setModelActionDrill,
}) => {
  const [data, setData] = useState<ModelsResponce[]>([]);
  const [modelAction, setModelAction] = useState<string | null>(null);
  const prevActionRef = useRef<string | null>(null);

  useEffect(() => {
    if (action != null) {
      fetchModels(action).then((res) => setData(res));
      prevActionRef.current = action;
    }
    if (prevActionRef.current != action) {
      setModelAction(null);
    }
  }, [action]);

  return (
    <div>
      <h2>Модель</h2>
      {/* {action} */}
      <Select
        disabled={action == null}
        value={modelAction}
        onValueChange={(e) => {
          setAction(e);
          setModelAction(e);
          setModelActionDrill(e);
        }}
        defaultValue={null}
      >
        <SelectTrigger>
          <SelectValue placeholder="Производитель" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>Выберите производителя</SelectItem>
          {data.map((item) => (
            <SelectItem key={item.Action} value={item.Action} className="">
              <div className="w-full block border-2 ">
                <span>{item.DisplayValue}</span>{" "}
                <span className="font-bold ">{`(${item.Count})`}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

interface GenerationRowProps {
  action: string | null;
  setAction: React.Dispatch<React.SetStateAction<string | null>>;
}
const GenerationRow: React.FC<GenerationRowProps> = ({ action, setAction }) => {
  const [GenerationAction, setGenerationAction] = useState<string | null>(null);
  const [data, setData] = useState<GenerationResponce[]>([]);
  const prevActionRef = useRef<string | null>(null);
  useEffect(() => {
    if (action != null) {
      fetchGeneration(action).then((res) => setData(res));
      prevActionRef.current = action;
    }
    if (prevActionRef.current != action) {
      setGenerationAction(null);
    }
  }, [action]);

  return (
    <div>
      <h2>Поколение</h2>

      <Select
        value={GenerationAction}
        onValueChange={(e) => {
          setAction(e);
          setGenerationAction(e);
        }}
        disabled={action == null}
      >
        <SelectTrigger>
          <SelectValue placeholder="Производитель" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>Выберите производителя</SelectItem>
          {data.map((item) => (
            <SelectItem key={item.Action} value={item.Action} className="">
              <div className="w-full block border-2 ">
                <span>{item.DisplayValue}</span>{" "}
                <span className="font-bold ">{`(${item.Count})`}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
