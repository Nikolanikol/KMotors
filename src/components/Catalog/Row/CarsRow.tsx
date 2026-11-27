import { CatalogPagination } from "./CatalogPagination";
import { getString } from "./utils";
import { getCars } from "./utils/service";
import { CarSearchParams } from "./utils/Types";
import FunnelTracker from "@/components/analytics/FunnelTracker";

import CarCard from "./CarCard";
import { headers } from "next/headers";
import { getFx } from "@/lib/fx";
import { catalogPageSize } from "@/utils/device";
import { Search, WifiOff } from "lucide-react";
import Link from "next/link";
import { pageHref, reachableTotalPages, resolvePage } from "@/lib/catalogPagination";

type Messages = {
  empty: string; byNo: string; retry: string; failed: string; failedHint: string;
  outOfRange: string; outOfRangeHint: string; toFirst: string; toLast: string;
};

const MESSAGES: Record<string, Messages> = {
  ru: {
    empty: "Ничего не найдено",
    byNo: "Авто с номером «{no}» не найдено",
    retry: "Проверьте номер и попробуйте снова",
    failed: "Каталог временно недоступен",
    failedHint: "Источник данных не отвечает. Обновите страницу через минуту.",
    outOfRange: "Страницы с таким номером нет",
    outOfRangeHint: "Дальше этого номера выдача не листается — вернитесь к списку.",
    toFirst: "К первой странице",
    toLast: "К последней странице",
  },
  en: {
    empty: "Nothing found",
    byNo: "No car found with plate “{no}”",
    retry: "Check the plate number and try again",
    failed: "Catalog is temporarily unavailable",
    failedHint: "The data source is not responding. Please refresh in a minute.",
    outOfRange: "This page does not exist",
    outOfRangeHint: "The list does not go this deep — go back to the list.",
    toFirst: "To the first page",
    toLast: "To the last page",
  },
  ka: {
    empty: "არაფერი მოიძებნა",
    byNo: "ავტომობილი ნომრით „{no}“ ვერ მოიძებნა",
    retry: "შეამოწმეთ ნომერი და სცადეთ ხელახლა",
    failed: "კატალოგი დროებით მიუწვდომელია",
    failedHint: "მონაცემთა წყარო არ პასუხობს. განაახლეთ გვერდი წუთის შემდეგ.",
    outOfRange: "ასეთი გვერდი არ არსებობს",
    outOfRangeHint: "სია ამ სიღრმემდე არ გრძელდება — დაუბრუნდით სიას.",
    toFirst: "პირველ გვერდზე",
    toLast: "ბოლო გვერდზე",
  },
  ar: {
    empty: "لم يتم العثور على شيء",
    byNo: "لم يتم العثور على سيارة برقم «{no}»",
    retry: "تحقق من الرقم وحاول مرة أخرى",
    failed: "الكتالوج غير متاح مؤقتًا",
    failedHint: "مصدر البيانات لا يستجيب. يرجى تحديث الصفحة بعد دقيقة.",
    outOfRange: "هذه الصفحة غير موجودة",
    outOfRangeHint: "القائمة لا تمتد إلى هذا العمق — ارجع إلى القائمة.",
    toFirst: "إلى الصفحة الأولى",
    toLast: "إلى الصفحة الأخيرة",
  },
};

/** Страница вне выдачи: не тупик, а сообщение и ссылка назад (фильтры сохраняются). */
function OutOfRange({ m, href, label, funnelPage }: { m: Messages; href: string; label: string; funnelPage: number }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
      <FunnelTracker
        view={{ event: "view_item_list", params: { item_list_name: "encar_catalog", result: "empty", count: 0, page: funnelPage } }}
      />
      <Search className="w-12 h-12 opacity-20" style={{ color: "var(--axis-gray)" }} />
      <p className="text-base font-medium" style={{ color: "var(--axis-gray)" }}>{m.outOfRange}</p>
      <p className="text-sm" style={{ color: "rgba(120,120,120,0.8)" }}>{m.outOfRangeHint}</p>
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-medium text-white bg-[var(--axis-bronze-deep)] transition hover:brightness-115 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]"
      >
        {label}
      </Link>
    </div>
  );
}

const CarsRow = async ({ searchParams, lang = "ru" }: { searchParams: CarSearchParams; lang?: string }) => {
  const params = await searchParams;
  const m = MESSAGES[lang] || MESSAGES.ru;
  // На мобиле меньше карточек на страницу — легче HTML/DOM/JS.
  const pageSize = catalogPageSize((await headers()).get("user-agent"));
  // Нечисловой page → 1; page глубже потолка Encar — в Encar не ходим (см. catalogPagination).
  const { page, outOfRange } = resolvePage(params.page, pageSize);
  const basePath = `/${lang}/catalog`;

  if (outOfRange) {
    return (
      <OutOfRange m={m} href={pageHref(basePath, params, 1)} label={m.toFirst} funnelPage={page} />
    );
  }

  const offset = String((page - 1) * pageSize); // page=1→0, page=2→pageSize, …
  const newString = getString(params);

  const [{ data, count, failed }, rates] = await Promise.all([
    getCars(newString, offset, pageSize),
    getFx("car"),
  ]);

  // Апстрим не ответил — это не «пустая выдача», сообщение должно отличаться.
  if (failed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
        {/* Сбой Encar глазами воронки: человек пришёл, а машин нет. */}
        <FunnelTracker view={{ event: "view_item_list", params: { item_list_name: "encar_catalog", result: "unavailable" } }} />
        <WifiOff className="w-12 h-12 opacity-20" style={{ color: "var(--axis-gray)" }} />
        <p className="text-base font-medium" style={{ color: "var(--axis-gray)" }}>{m.failed}</p>
        <p className="text-sm" style={{ color: "rgba(120,120,120,0.8)" }}>{m.failedHint}</p>
      </div>
    );
  }

  // Страница дальше конца выдачи: для неё Encar на глубоких offset отвечает 200 и
  // отдаёт чужие машины, поэтому по count отсекаем сами, не доверяя data.
  const totalPages = reachableTotalPages(count, pageSize);
  if (page > 1 && (!data || data.length === 0 || page > totalPages)) {
    return (
      <OutOfRange
        m={m}
        href={pageHref(basePath, params, Math.max(1, totalPages))}
        label={totalPages > 1 ? m.toLast : m.toFirst}
        funnelPage={page}
      />
    );
  }

  if (!data || data.length === 0) {
    const isCarNoSearch = !!params.carNo;
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <FunnelTracker
          view={{ event: "view_item_list", params: { item_list_name: "encar_catalog", result: "empty", count: 0 } }}
        />
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
      {/* Шаг воронки «увидел выдачу»: страница, число машин, применён ли фильтр. */}
      <FunnelTracker
        view={{
          event: "view_item_list",
          params: { item_list_name: "encar_catalog", result: "ok", count, page, filtered: !!params.action },
        }}
      />
      <div id="cars-grid" data-nav-dim className="grid grid-cols-1 sm:grid-cols-2 items-start gap-5 min-h-[80vh]">
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
        <CatalogPagination total={totalPages} current={page} lang={lang} searchParams={params} />
      </div>
    </div>
  );
};
export default CarsRow;
