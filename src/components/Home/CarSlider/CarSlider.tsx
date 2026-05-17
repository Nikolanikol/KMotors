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
    <div className="px-4 py-2  min-h-80">
      <h2 className="text-lg md:ml-20  font-bold mb-2 heading-2">{title}</h2>
      <div className="flex  overflow-x-scroll py-10 gap-5">
        <AutoSlider data={data} krwToRub={rates.krwToRub} krwToUsd={rates.krwToUsd} />
      </div>
    </div>
  );
};

export default CarSlider;
