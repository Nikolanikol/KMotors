"use client";
import React, { useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";
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

/*************  ✨ Windsurf Command ⭐  *************/

const Filter = ({}) => {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  ///Filters
  const [manufactureAction, setManufactureAction] = useState<string | null>(
    null
  );
  const [modelActionDrill, setModelActionDrill] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);

  const handleAction = (value: string) => {
    // setManufactureAction(value);

    const newParams = new URLSearchParams(params.toString());
    newParams.set("action", value);
    startTransition(() => {
      router.push(`/catalog?${newParams.toString()}`);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <h2>Filter</h2>

      <Select
        value={manufactureAction}
        onValueChange={(e) => {
          setAction(e);
          setManufactureAction(e);
        }}
      >
        <SelectTrigger className="w-[180px]">
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

      {/* ///////////////////////////// */}
      <Button disabled={action == null} onClick={() => handleAction(action)}>
        Показать
      </Button>
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
  useEffect(() => {
    if (action != null) {
      fetchModels(action).then((res) => setData(res));
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
        <SelectTrigger className="w-[180px]">
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
  useEffect(() => {
    if (action != null) {
      fetchGeneration(action).then((res) => setData(res));
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
        <SelectTrigger className="w-[180px]">
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
