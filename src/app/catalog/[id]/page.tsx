import CarouselLight from "@/components/Catalog/CarIdPage/Carousel/Carousel";
import DetailInfo from "@/components/Catalog/CarIdPage/DetailInfo";
import Header from "@/components/Catalog/CarIdPage/Header";
import OptionsRow from "@/components/Catalog/CarIdPage/OptionsRow/OptionsRow";
import { Button } from "@/components/ui/button";

import { FC } from "react";

interface PageProps {
  params: {
    id: string;
  };
}
export async function fetchData(id: string): Promise<any> {
  try {
    return await fetch(`https://api.encar.com/v1/readside/vehicle/${id}`)
      .then((data) => data.json())
      .then((res) => res);
  } catch (error) {
    console.log(error);
  }
}
const Page: FC<PageProps> = async ({ params }) => {
  const data = await fetchData(params.id);

  return (
    <div className="bg-gray-200 py-5 rounded-3xl">
      <div className="container mx-auto ">
        <Header data={data} />
        <CarouselLight photos={data.photos} />
        <OptionsRow data={data.options} />
        <DetailInfo id={data?.vehicleId} carnumber={data?.vehicleNo} />
        <div className="flex items-center justify-center mt-6">
          <Button className="py-3 px-6 text-lg" variant="destructive">
            <a
              target="_blank"
              href={
                "https://www.encar.com/md/sl/mdsl_regcar.do?method=inspectionViewNew&carid=" +
                data?.vehicleId
              }
            >
              Просмотреть подробный отчет
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Page;
