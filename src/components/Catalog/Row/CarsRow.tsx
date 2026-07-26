import { Pagination } from "./Pagination";
import { getString } from "./utils";
import { getCars } from "./utils/service";
import { CarSearchParams } from "./utils/Types";
import CarCard from "./CarCard";
import { Suspense } from "react";
import { headers } from "next/headers";
import { getCurrencyRates } from "@/utils/getCurrencyRates";
import { catalogPageSize } from "@/utils/device";
import { Search, WifiOff } from "lucide-react";

const MESSAGES: Record<string, { empty: string; byNo: string; retry: string; failed: string; failedHint: string }> = {
  ru: {
    empty: "Ничего не найдено",
    byNo: "Авто с номером «{no}» не найдено",
    retry: "Проверьте номер и попробуйте снова",
    failed: "Каталог временно недоступен",
    failedHint: "Источник данных не отвечает. Обновите страницу через минуту.",
  },
  en: {
    empty: "Nothing found",
    byNo: "No car found with plate “{no}”",
    retry: "Check the plate number and try again",
    failed: "Catalog is temporarily unavailable",
    failedHint: "The data source is not responding. Please refresh in a minute.",
  },
  ka: {
    empty: "არაფერი მოიძებნა",
    byNo: "ავტომობილი ნომრით „{no}“ ვერ მოიძებნა",
    retry: "შეამოწმეთ ნომერი და სცადეთ ხელახლა",
    failed: "კატალოგი დროებით მიუწვდომელია",
    failedHint: "მონაცემთა წყარო არ პასუხობს. განაახლეთ გვერდი წუთის შემდეგ.",
  },
  ar: {
    empty: "لم يتم العثور على شيء",
    byNo: "لم يتم العثور على سيارة برقم «{no}»",
    retry: "تحقق من الرقم وحاول مرة أخرى",
    failed: "الكتالوج غير متاح مؤقتًا",
    failedHint: "مصدر البيانات لا يستجيب. يرجى تحديث الصفحة بعد دقيقة.",
  },
};

const CarsRow = async ({ searchParams, lang = "ru" }: { searchParams: CarSearchParams; lang?: string }) => {
  const params = await searchParams;
  const m = MESSAGES[lang] || MESSAGES.ru;
  const page = Math.max(1, Number(params.page || "1"));
  // На мобиле меньше карточек на страницу — легче HTML/DOM/JS.
  const pageSize = catalogPageSize((await headers()).get("user-agent"));
  const offset = String((page - 1) * pageSize); // page=1→0, page=2→pageSize, …
  const newString = getString(params);

  const [{ data, count, failed }, rates] = await Promise.all([
    getCars(newString, offset, pageSize),
    getCurrencyRates(),
  ]);

  // Апстрим не ответил — это не «пустая выдача», сообщение должно отличаться.
  if (failed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
        <WifiOff className="w-12 h-12 opacity-20" style={{ color: "var(--axis-gray)" }} />
        <p className="text-base font-medium" style={{ color: "var(--axis-gray)" }}>{m.failed}</p>
        <p className="text-sm" style={{ color: "rgba(120,120,120,0.8)" }}>{m.failedHint}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    const isCarNoSearch = !!params.carNo;
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Search className="w-12 h-12 opacity-20" style={{ color: "var(--axis-gray)" }} />
        <p className="text-base font-medium" style={{ color: "var(--axis-gray)" }}>
          {isCarNoSearch ? m.byNo.replace("{no}", params.carNo || "") : m.empty}
        </p>
        {isCarNoSearch && (
          <p className="text-sm" style={{ color: "rgba(120,120,120,0.8)" }}>
            {m.retry}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div id="cars-grid" className="grid grid-cols-1 sm:grid-cols-2 items-start gap-5 min-h-[80vh]">
        {data
          .filter((item: { Id?: string }) => !!item?.Id)
          .map(
            (item: {
              Id: string;
              Photos?: { location: string; type: string }[];
              Model: string;
              Manufacturer: string;
              Year: string;
              Mileage: string;
              Transmission: string;
              FuelType: string;
              Price: string;
            }, index: number) => (
              <CarCard
                key={item.Id}
                id={item.Id}
                photo={item.Photos?.[0]?.location}
                model={item.Model}
                manufacture={item.Manufacturer}
                year={item.Year}
                mileage={item.Mileage}
                transmission={item.Transmission}
                fuel={item.FuelType}
                price={item.Price}
                krwToRub={rates.krwToRub}
                krwToUsd={rates.krwToUsd}
                priority={index < 2}
              />
            )
          )}
      </div>
      <div className="flex gap-2 mt-8 pb-8">
        <Pagination count={count} pageSize={pageSize} />
      </div>
    </div>
  );
};
export default CarsRow;
