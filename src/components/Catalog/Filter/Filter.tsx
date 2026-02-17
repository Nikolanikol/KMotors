"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslation } from "react-i18next";
import { translateGenerationRow } from "@/utils/translateGenerationRow";
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
import { ScrollArea } from "@/components/ui/scroll-area";

/*************  ✨ Windsurf Command ⭐  *************/

const Filter = ({}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  ///Filters
  const [manufactureAction, setManufactureAction] = useState<string | null>(
    null,
  );
  const [manufacture, setManufacture] = useState<string | null>(null);
  const [modelActionDrill, setModelActionDrill] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>("");

  const handleAction = (value: string | null) => {
    if (value != null) {
      startTransition(() => {
        router.push(
          `/catalog?action=${value}&page=1&priceMin=${price.minPrice}&priceMax=${price.maxPrice}&mileageMin=${mileage.minMileage}&mileageMax=${mileage.maxMileage}&yearMin=${year.minYear}&yearMax=${year.maxYear}&manufacture=%${manufacture}`,
        );
      });
    }
  };
  /////////////////////////////////
  const [price, setPrice] = useState({
    minPrice: "",
    maxPrice: "",
  });
  const [mileage, setMileage] = useState({
    minMileage: "",
    maxMileage: "",
  });
  const [year, setYear] = useState({ minYear: "", maxYear: "" });
  return (
    <div className="flex flex-col gap-2">
      <h2>{t("filter.manufacturer")}</h2>

      <Select
        value={manufactureAction}
        onValueChange={(e) => {
          setAction(e);
          setManufactureAction(e);
          setManufacture(
            () => data.filter((item) => item.Action == e)[0].title,
          );
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={t("filter.manufacturer")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>{t("filter.selectManufacturer")}</SelectItem>
          {data.map((item) => (
            <SelectItem key={item.Action} value={item.Action}>
              {item.title}
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

      <MyFilterPrice setPrice={setPrice} />
      <MyFilterMileage setMileage={setMileage} />
      <MyFilterYear setYear={setYear} />
      {/* ///////////////////////////// */}
      <Button onClick={() => handleAction(action)}>{t("filter.show")}</Button>
      {isPending && (
        <div className="top-0 left-0   bottom-0 right-0 z-20 absolute bg-gray-300 opacity-30 border-2 border-black">
          {t("filter.updating")}
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
  const { t, i18n } = useTranslation();
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
      <h2>{t("filter.model")}</h2>
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
          <SelectValue placeholder={t("filter.model")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>{t("filter.selectModel")}</SelectItem>
          <ScrollArea className="h-96">
            {data.map((item) => (
              <SelectItem key={item.Action} value={item.Action} className="">
                <div className="w-full block border-2 ">
                  <span>
                    {i18n.language === "ko"
                      ? item.DisplayValue
                      : item.Metadata?.EngName?.[0] || item.DisplayValue}
                  </span>{" "}
                  <span className="font-bold ">{`(${item.Count})`}</span>
                </div>
              </SelectItem>
            ))}
          </ScrollArea>
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
  const { t } = useTranslation();
  const [GenerationAction, setGenerationAction] = useState<string | null>(null);
  const [data, setData] = useState<GenerationResponce[]>([]);
  const prevActionRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevActionRef.current != action) {
      setGenerationAction(null);
    }
    if (action != null) {
      fetchGeneration(action).then((res) => setData(res));
      prevActionRef.current = action;
    }
  }, [action]);

  return (
    <div>
      <h2>{t("filter.generation")}</h2>

      <Select
        value={GenerationAction}
        onValueChange={(e) => {
          setAction(e);
          setGenerationAction(e);
        }}
        disabled={action == null}
      >
        <SelectTrigger>
          <SelectValue placeholder={t("filter.generation")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>{t("filter.selectGeneration")}</SelectItem>
          {data.map((item) => (
            <SelectItem key={item.Action} value={item.Action} className="">
              <div className="w-full block border-2 ">
                <span>{translateGenerationRow(item.DisplayValue, t)}</span>{" "}
                <span className="font-bold ">{`(${item.Count})`}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
