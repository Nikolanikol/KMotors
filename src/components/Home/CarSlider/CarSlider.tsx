import { ICarResponce } from "./dataType";
import AutoSlider from "./Slider";
import { getCurrencyRates } from "@/utils/getCurrencyRates";

const getCars = async (reqString: string) => {
  try {
    const res = await fetch(reqString, { cache: "force-cache" });
    if (!res.ok) return [];
    const data: ICarResponce = await res.json();
    return data.SearchResults ?? [];
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 min-h-80">
      <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6" style={{ color: "var(--axis-white)" }}>{title}</h2>
      <div className="flex overflow-x-auto scrollbar-hide py-4 gap-5 pb-6">
        <AutoSlider data={data} krwToRub={rates.krwToRub} krwToUsd={rates.krwToUsd} />
      </div>
    </div>
  );
};

export default CarSlider;
