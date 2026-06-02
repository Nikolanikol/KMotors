"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { translateGenerationRow } from "@/utils/translateGenerationRow";
import { data } from "./FilterData";
import { trackEvent } from "@/utils/gtag";
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

/*************  ✨ Windsurf Command ⭐  *************/

const Filter = ({}) => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Читаем начальные значения из URL
  const initAction = searchParams.get("action") ?? "";
  const initManufacture = searchParams.get("manufacture")?.replace(/^%/, "") ?? null;
  const initPriceMin = searchParams.get("priceMin") ?? "";
  const initPriceMax = searchParams.get("priceMax") ?? "";
  const initMileageMin = searchParams.get("mileageMin") ?? "";
  const initMileageMax = searchParams.get("mileageMax") ?? "";
  const initYearMin = searchParams.get("yearMin") ?? "";
  const initYearMax = searchParams.get("yearMax") ?? "";

  const initCarNo = searchParams.get("carNo") ?? "";
  const [carNo, setCarNo] = useState(initCarNo);

  const handleCarNoSearch = () => {
    if (!carNo.trim()) return;
    const lang = i18n.language || "ru";
    startTransition(() => {
      router.push(`/${lang}/catalog?carNo=${encodeURIComponent(carNo.trim())}&page=1`);
    });
  };

  const [manufactureAction, setManufactureAction] = useState<string | null>(null);
  const [manufacture, setManufacture] = useState<string | null>(initManufacture);
  const [modelActionDrill, setModelActionDrill] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(initAction);

  const handleAction = (value: string | null) => {
    if (value != null) {
      const lang = i18n.language || "ru";
      startTransition(() => {
        router.push(
          `/${lang}/catalog?action=${value}&page=1&priceMin=${price.minPrice}&priceMax=${price.maxPrice}&mileageMin=${mileage.minMileage}&mileageMax=${mileage.maxMileage}&yearMin=${year.minYear}&yearMax=${year.maxYear}&manufacture=%${manufacture}`,
        );
      });
    }
  };

  const [price, setPrice] = useState({
    minPrice: initPriceMin,
    maxPrice: initPriceMax,
  });
  const [mileage, setMileage] = useState({
    minMileage: initMileageMin,
    maxMileage: initMileageMax,
  });
  const [year, setYear] = useState({
    minYear: initYearMin,
    maxYear: initYearMax,
  });

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl" style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}>

      {/* Поиск по номеру авто */}
      <div className="pb-3 border-b" style={{ borderColor: "rgba(74,74,74,0.3)" }}>
        <h2 className="text-sm font-semibold tracking-wide mb-2" style={{ color: "var(--axis-gray)" }}>{t("filter.carNoSearch")}</h2>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--axis-gray)" }} />
            <input
              value={carNo}
              onChange={(e) => setCarNo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCarNoSearch()}
              placeholder={t("filter.carNoPlaceholder")}
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none focus:ring-1"
              style={{
                backgroundColor: "var(--axis-graphite)",
                border: "1px solid rgba(74,74,74,0.4)",
                color: "var(--axis-white)",
                caretColor: "var(--axis-orange)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--axis-orange)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(74,74,74,0.4)")}
            />
          </div>
          <Button
            onClick={handleCarNoSearch}
            className="shrink-0 px-4 text-sm font-semibold"
            style={{ backgroundColor: "var(--axis-orange)", color: "var(--axis-white)" }}
          >
            {t("filter.carNoButton")}
          </Button>
        </div>
      </div>

      <h2 className="text-sm font-semibold tracking-wide" style={{ color: "var(--axis-gray)" }}>{t("filter.manufacturer")}</h2>

      <Select
        value={manufactureAction}
        onValueChange={(e) => {
          setAction(e);
          setManufactureAction(e);
          const title = data.filter((item) => item.Action == e)[0].title;
          setManufacture(() => title);
          trackEvent("filter_manufacturer", { manufacturer: title });
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

      <MyFilterPrice setPrice={setPrice} defaultMin={initPriceMin} defaultMax={initPriceMax} />
      <MyFilterMileage setMileage={setMileage} defaultMin={initMileageMin} defaultMax={initMileageMax} />
      <MyFilterYear setYear={setYear} defaultMin={initYearMin} defaultMax={initYearMax} />
      {/* ///////////////////////////// */}
      <Button onClick={() => {
        handleAction(action);
        trackEvent("filter_apply", {
          manufacturer: manufacture ?? "",
          price_min: price.minPrice,
          price_max: price.maxPrice,
          year_min: year.minYear,
          year_max: year.maxYear,
        });
      }}>{t("filter.show")}</Button>
      {isPending && (
        <div className="absolute inset-0 z-20 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(10,10,10,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--axis-orange)" }}>
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {t("filter.updating")}
          </div>
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
      <h2 className="text-sm font-semibold tracking-wide mt-1" style={{ color: "var(--axis-gray)" }}>{t("filter.model")}</h2>
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
        <SelectContent className="max-h-[min(384px,var(--radix-select-content-available-height))]">
          <SelectItem value={null}>{t("filter.selectModel")}</SelectItem>
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
      <h2 className="text-sm font-semibold tracking-wide mt-1" style={{ color: "var(--axis-gray)" }}>{t("filter.generation")}</h2>

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
