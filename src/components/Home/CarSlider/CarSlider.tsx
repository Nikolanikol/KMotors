import { ICarResponce } from "./dataType";
import AutoSlider from "./Slider";
import { getCurrencyRates } from "@/utils/getCurrencyRates";

const getCars = async (reqString: string) => {
  try {
    const res = await fetch(reqString, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data: ICarResponce = await res.json();
    // Normalize: direct Encar API returns numbers, proxy returns strings
    return (data.SearchResults ?? []).map((car) => ({
      ...car,
      Mileage: String(car.Mileage ?? ""),
      Price: String(car.Price ?? ""),
      // ⚠️ Photos обрезается до ПЕРВОГО кадра: карточка показывает ровно его
      // (Slider.tsx: `photo={item.Photos[0].location}`), а Encar присылает весь
      // альбом объявления — по ~24 кадра на машину. При двух каруселях по 20
      // машин это 964 URL в RSC-payload главной при 66 реальных <img> на
      // странице (замер 22.08.2026). Массив уезжает в HTML целиком, потому что
      // данные передаются в клиентский компонент.
      // Понадобится галерея прямо в карточке — резать здесь под её нужды, а не
      // возвращать весь альбом.
      Photos: (car.Photos ?? []).slice(0, 1),
    }));
  } catch {
    return [];
  }
};

type CarSliderProps = {
  reqString: string;
  title: string;
};

const CarSlider = async ({ reqString, title }: CarSliderProps) => {
  const [data, rates] = await Promise.all([
    getCars(reqString),
    getCurrencyRates(),
  ]);

  if (!data || data.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
      <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6" style={{ color: "var(--axis-white)" }}>{title}</h2>
      <div className="flex overflow-x-auto scrollbar-hide py-4 gap-5 pb-6">
        <AutoSlider data={data} krwToRub={rates.krwToRub} krwToUsd={rates.krwToUsd} />
      </div>
    </div>
  );
};

export default CarSlider;
