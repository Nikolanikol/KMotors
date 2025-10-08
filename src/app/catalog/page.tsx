import Filter from "@/components/Catalog/Filter/Filter";
import CarsRow from "@/components/Catalog/Row/CarsRow";
import { CarSearchParams } from "@/components/Catalog/Row/utils/Types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

//MY proxy string
// https://proxy-8mpk.onrender.com/proxy?url=https

//Basarish proxy string
// filterString
// https://encar-proxy-main.onrender.com/api/nav?count=true&q=(And.Hidden.N._.CarType.Y.)&inav=%7CMetadata%7CSort
// carString
// https://api.encar.com/search/car/list/general?count=true&q=${query}&inav=%7CMetadata%7CSort

export default async function ({
  searchParams,
}: {
  searchParams: CarSearchParams;
}) {
  return (
    <div>
      <form action="" className="border-2 flex justify-end">
        {" "}
        <div className="flex ">
          <Input type="text" /> <Button type="submit">submit</Button>
        </div>
      </form>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-2 h-full m-0 mx-auto">
        {/* каталог */}
        {/* <div className="col-span-1 lg:col-span-4 h-ful px-1 py-2 ">
          <Filter />
        </div> */}
        {/* машины */}
        <div className="col-span-1 lg:col-span-8  h-full ">
          <CarsRow searchParams={searchParams} />
        </div>
      </div>
    </div>
  );
}
