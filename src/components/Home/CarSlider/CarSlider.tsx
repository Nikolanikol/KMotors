import { ICarResponce } from "./dataType";
import AutoSlider from "./Slider";

const getCars = async (reqString: string) => {
  const res = await fetch(reqString, {
    cache: "force-cache", // можно использовать "no-store" для SSR
  });

  if (!res.ok) throw new Error("Failed to fetch cars");
  const data: ICarResponce = await res.json();
  return data.SearchResults;
};
type CarSliderProps = {
  reqString: string;
  title: string;
};
const CarSlider = async ({ reqString, title }: CarSliderProps) => {
  const data = await getCars(reqString);

  return (
    <div className="px-4 py-2  min-h-80">
      <h2 className="text-lg ml-20 font-bold mb-2 heading-2">{title}</h2>
      <div className="flex  overflow-x-scroll py-10 gap-5">
        <AutoSlider data={data} />
      </div>
    </div>
  );
};

export default CarSlider;
