"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";
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
  fetchBadge,
  fetchBadgeDetail,
  fetchBadgeGroup,
  fetchGeneration,
  fetchModels,
  GenerationResponce,
  ModelsResponce,
  NO_TRIM,
  NavFacet,
} from "./FilterService";
import MyFilterPrice from "./FilterComponents/MyFilterPrice";
import MyFilterMileage from "./FilterComponents/MyFilterMileage";
import MyFilterYear from "./FilterComponents/MyFilterYear";

/*************  ✨ Windsurf Command ⭐  *************/

/**
 * Значение пункта «любой» во всех выпадашках фильтра.
 *
 * ⚠️ Раньше у таких пунктов стояло `value={null}`, и это ломалось молча: Radix
 * ждёт строку, а обработчик марки делал `data.filter(...)[0].title` — на сбросе
 * совпадений нет, `[0]` это undefined, и фильтр падал целиком в границу ошибок.
 * Пустую строку Radix тоже не принимает, отсюда служебная константа.
 */
const ANY_VALUE = "__any";

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

  const HISTORY_KEY = "kmotors_carno_history";
  const initCarNo = searchParams.get("carNo") ?? "";
  const [carNo, setCarNo] = useState(initCarNo);
  const [carNoError, setCarNoError] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  // Корейский номер: 12가3456 / 317주9018 / 서울12가3456
  const KOREAN_PLATE = /^([가-힣]{2})?\d{2,3}[가-힣]\d{4}$/;

  const saveHistory = (val: string) => {
    const next = [val, ...history.filter((h) => h !== val)].slice(0, 5);
    setHistory(next);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
  };

  const handleCarNoSearch = (val = carNo) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (!KOREAN_PLATE.test(trimmed)) {
      setCarNoError(t("filter.carNoInvalid"));
      return;
    }
    setCarNoError("");
    saveHistory(trimmed);
    setCarNo(trimmed);
    const lang = i18n.language || "ru";
    startTransition(() => {
      router.push(`/${lang}/catalog?carNo=${encodeURIComponent(trimmed)}&page=1`);
    });
  };

  const handleClearCarNo = () => {
    setCarNo("");
    setCarNoError("");
    const lang = i18n.language || "ru";
    startTransition(() => {
      router.push(`/${lang}/catalog?page=1`);
    });
  };

  const [manufactureAction, setManufactureAction] = useState<string | null>(null);
  const [manufacture, setManufacture] = useState<string | null>(initManufacture);
  const [modelActionDrill, setModelActionDrill] = useState<string | null>(null);
  // Цепочка вниз: поколение → топливо/привод → объём → комплектация. Каждый
  // уровень отдаёт СВОЙ Action следующему, потому что дерево iNav раскрывает
  // фасеты уровня N только когда в запросе выбран N−1.
  const [generationDrill, setGenerationDrill] = useState<string | null>(null);
  const [badgeGroupDrill, setBadgeGroupDrill] = useState<string | null>(null);
  const [badgeDrill, setBadgeDrill] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(initAction);

  /**
   * Сброс всех уровней ниже марки.
   *
   * ⚠️ Без него сброс марки оставлял модель, поколение и комплектацию от
   * ПРЕЖНЕГО бренда: ModelsRow чистит только собственное значение и вниз
   * ничего не отдаёт.
   */
  const resetChain = () => {
    setModelActionDrill(null);
    setGenerationDrill(null);
    setBadgeGroupDrill(null);
    setBadgeDrill(null);
  };

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
    <div className="flex flex-col gap-3 p-4 rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}>

      {/* Поиск по номеру авто */}
      <div className="pb-3 border-b" style={{ borderColor: "rgba(74,74,74,0.3)" }}>
        <h2 className="text-sm font-semibold tracking-wide mb-2" style={{ color: "var(--axis-gray)" }}>{t("filter.carNoSearch")}</h2>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--axis-gray)" }} />
            <input
              value={carNo}
              onChange={(e) => { setCarNo(e.target.value); setCarNoError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleCarNoSearch()}
              placeholder={t("filter.carNoPlaceholder")}
              className="w-full pl-8 pr-7 py-2 text-sm rounded-lg outline-none"
              style={{
                backgroundColor: "var(--axis-graphite)",
                border: "1px solid rgba(74,74,74,0.4)",
                color: "var(--axis-white)",
                caretColor: "var(--axis-orange)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--axis-orange)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(74,74,74,0.4)")}
            />
            {carNo && (
              <button
                onClick={handleClearCarNo}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
                style={{ color: "var(--axis-gray)" }}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <Button
            onClick={() => handleCarNoSearch()}
            className="shrink-0 px-4 text-sm font-semibold"
            style={{ backgroundColor: "var(--axis-bronze-deep)", backgroundImage: "var(--axis-bronze-fill)", color: "var(--axis-white)" }}
          >
            {t("filter.carNoButton")}
          </Button>
        </div>
        {carNoError && (
          <p className="text-xs mt-1.5" style={{ color: "#f87171" }}>{carNoError}</p>
        )}
        {/* История поиска */}
        {history.length > 0 && !carNo && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {history.map((h) => (
              <button
                key={h}
                onClick={() => handleCarNoSearch(h)}
                className="px-2.5 py-1 text-xs rounded-full transition-all hover:opacity-80"
                style={{
                  backgroundColor: "var(--axis-graphite)",
                  border: "1px solid rgba(74,74,74,0.4)",
                  color: "var(--axis-gray)",
                }}
              >
                {h}
              </button>
            ))}
          </div>
        )}
      </div>

      <h2 className="text-sm font-semibold tracking-wide" style={{ color: "var(--axis-gray)" }}>{t("filter.manufacturer")}</h2>

      <Select
        value={manufactureAction ?? ANY_VALUE}
        onValueChange={(e) => {
          const next = e === ANY_VALUE ? null : e;
          // find, а не filter(...)[0]: на сбросе совпадений нет вовсе.
          const title = data.find((item) => item.Action === next)?.title ?? null;

          setAction(next);
          setManufactureAction(next);
          setManufacture(title);
          resetChain();

          if (title) trackEvent("filter_manufacturer", { manufacturer: title });
        }}
      >
        <SelectTrigger className="filter-select">
          <SelectValue placeholder={t("filter.manufacturer")} />
        </SelectTrigger>
        <SelectContent className="filter-menu">
          <SelectItem value={ANY_VALUE}>{t("filter.selectManufacturer")}</SelectItem>
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
      <GenerationRow
        action={modelActionDrill}
        setAction={setAction}
        onSelect={setGenerationDrill}
      />

      {/* Топливо и привод → объём → комплектация. Каждый уровень скрывается,
          пока Encar не отдал по нему ни одного фасета: у части поколений их
          нет вовсе, и пустая выпадашка выглядела бы поломкой. */}
      <NavRow
        label={t("filter.engine")}
        placeholder={t("filter.selectEngine")}
        action={generationDrill}
        fetcher={fetchBadgeGroup}
        setAction={setAction}
        onSelect={setBadgeGroupDrill}
      />
      <NavRow
        label={t("filter.trimGroup")}
        placeholder={t("filter.selectTrimGroup")}
        action={badgeGroupDrill}
        fetcher={fetchBadge}
        setAction={setAction}
        onSelect={setBadgeDrill}
      />
      <NavRow
        label={t("filter.trim")}
        placeholder={t("filter.selectTrim")}
        action={badgeDrill}
        fetcher={fetchBadgeDetail}
        setAction={setAction}
      />

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
  const [loading, setLoading] = useState(false);
  const prevActionRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevActionRef.current !== action) {
      setModelAction(null);
      // Марка сменилась или сброшена — поколение и всё ниже обязаны обнулиться.
      setModelActionDrill(null);
      if (action == null) setData([]);
    }
    if (action != null) {
      setLoading(true);
      fetchModels(action)
        .then((res) => setData(res))
        .finally(() => setLoading(false));
    }
    prevActionRef.current = action;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  return (
    <div>
      <h2 className="text-sm font-semibold tracking-wide mt-1" style={{ color: "var(--axis-gray)" }}>{t("filter.model")}</h2>
      {/* {action} */}
      <Select
        disabled={action == null || loading}
        value={modelAction ?? ANY_VALUE}
        onValueChange={(e) => {
          const next = e === ANY_VALUE ? null : e;
          // На сбросе возвращаемся к запросу марки, иначе «Показать» ушёл бы с
          // пустым action и кнопка молча ничего не делала.
          setAction(next ?? action);
          setModelAction(next);
          setModelActionDrill(next);
        }}
      >
        <SelectTrigger className="filter-select">
          <SelectValue placeholder={loading ? t("filter.loading") : t("filter.model")} />
        </SelectTrigger>
        <SelectContent className="filter-menu max-h-[min(384px,var(--radix-select-content-available-height))]">
          <SelectItem value={ANY_VALUE}>{t("filter.selectModel")}</SelectItem>
          {data.map((item) => (
            <SelectItem key={item.Action} value={item.Action} className="">
              <div className="w-full block">
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
  /** Отдаёт выбранное поколение вниз — уровню «топливо и привод». */
  onSelect?: (value: string | null) => void;
}
const GenerationRow: React.FC<GenerationRowProps> = ({ action, setAction, onSelect }) => {
  const { t } = useTranslation();
  const [GenerationAction, setGenerationAction] = useState<string | null>(null);
  const [data, setData] = useState<GenerationResponce[]>([]);
  const [loading, setLoading] = useState(false);
  const prevActionRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevActionRef.current !== action) {
      setGenerationAction(null);
      // Сменилась модель — нижние уровни обязаны обнулиться, иначе в запросе
      // останется комплектация от прежней машины.
      onSelect?.(null);
      if (action == null) setData([]);
    }
    if (action != null) {
      setLoading(true);
      fetchGeneration(action)
        .then((res) => setData(res))
        .finally(() => setLoading(false));
    }
    prevActionRef.current = action;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  return (
    <div>
      <h2 className="text-sm font-semibold tracking-wide mt-1" style={{ color: "var(--axis-gray)" }}>{t("filter.generation")}</h2>

      <Select
        value={GenerationAction ?? ANY_VALUE}
        onValueChange={(e) => {
          const next = e === ANY_VALUE ? null : e;
          setAction(next ?? action);
          setGenerationAction(next);
          onSelect?.(next);
        }}
        disabled={action == null || loading}
      >
        <SelectTrigger className="filter-select">
          <SelectValue placeholder={loading ? t("filter.loading") : t("filter.generation")} />
        </SelectTrigger>
        <SelectContent className="filter-menu">
          <SelectItem value={ANY_VALUE}>{t("filter.selectGeneration")}</SelectItem>
          {data.map((item) => (
            <SelectItem key={item.Action} value={item.Action} className="">
              <div className="w-full block">
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

interface NavRowProps {
  label: string;
  placeholder: string;
  /** Запрос родительского уровня. null — родитель не выбран, уровня нет. */
  action: string | null;
  fetcher: (query: string) => Promise<NavFacet[]>;
  setAction: React.Dispatch<React.SetStateAction<string | null>>;
  /** Отдаёт выбранное значение следующему уровню вниз. */
  onSelect?: (value: string | null) => void;
}

/**
 * Один уровень дерева iNav: топливо/привод, объём или комплектация.
 *
 * Три уровня устроены одинаково, поэтому компонент один — в отличие от
 * ModelsRow и GenerationRow, которые писались до него и различаются только
 * способом подписи.
 *
 * ⚠️ Пока Encar не вернул ни одного фасета, строка не рендерится ВООБЩЕ. У
 * части поколений нижних уровней нет, и пустая выпадашка читалась бы как
 * поломка фильтра, а не как «здесь нечего выбирать».
 */
const NavRow: React.FC<NavRowProps> = ({
  label,
  placeholder,
  action,
  fetcher,
  setAction,
  onSelect,
}) => {
  const { t } = useTranslation();
  const [data, setData] = useState<NavFacet[]>([]);
  const [value, setValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const prevActionRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevActionRef.current !== action) {
      // Родитель сменился — сбрасываем себя и всех, кто ниже.
      setValue(null);
      onSelect?.(null);
      setData([]);
    }
    prevActionRef.current = action;

    if (action == null) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetcher(action)
      .then((res) => {
        // Ответы приходят не в том порядке, в каком уходили запросы: без этого
        // флага медленный ответ по прежнему поколению перезаписал бы свежий.
        if (!cancelled) setData(res);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  // ⚠️ Строка НЕ скрывается, даже когда выбирать нечего (решение владельца
  // 27.08.2026). Скрытие дёргало вёрстку: цена, пробег и год прыгали вверх-вниз
  // на каждый выбор, — и делало эти три уровня непохожими на «Модель» и
  // «Поколение», которые всегда на месте и просто отключены.
  const disabled = action == null || loading || data.length === 0;
  const hint = loading
    ? t("filter.loading")
    : action != null && data.length === 0
      ? t("filter.noOptions")
      : label;

  return (
    <div>
      <h2
        className="text-sm font-semibold tracking-wide mt-1"
        style={{ color: "var(--axis-gray)" }}
      >
        {label}
      </h2>
      <Select
        disabled={disabled}
        value={value ?? ANY_VALUE}
        onValueChange={(e) => {
          // ANY_VALUE — «любой», то есть возврат к запросу родителя: пустую
          // строку Radix в SelectItem не принимает, а null не проходит типами
          // (соседние строки фильтра его передают, и tsc на них ругается).
          const next = e === ANY_VALUE ? null : e;
          setAction(next ?? action);
          setValue(next);
          onSelect?.(next);
        }}
      >
        <SelectTrigger className="filter-select">
          <SelectValue placeholder={hint} />
        </SelectTrigger>
        <SelectContent className="filter-menu max-h-[min(384px,var(--radix-select-content-available-height))]">
          <SelectItem value={ANY_VALUE}>{placeholder}</SelectItem>
          {data.map((item) => (
            <SelectItem key={item.Action} value={item.Action}>
              <span>
                {item.DisplayValue === NO_TRIM
                  ? t("filter.noTrim")
                  : translateGenerationRow(item.DisplayValue, t)}
              </span>{" "}
              <span className="font-bold">{`(${item.Count})`}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
