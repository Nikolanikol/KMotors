import Link from "next/link";
import { Pagintaion } from "./Pagintaion";
import { generateFilterQuery } from "./utils";

async function getCars(query: string, offset: string = "0") {
  try {
    const res = await fetch(
      `https://api.encar.com/search/car/list/premium?count=true&q=${query}&sr=%7CModifiedDate%7C${offset}%7C20
`,
      {
        headers: {
          "user-agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
        },
      }
    );
    const data = await res.json();
    // console.log("ok");
    // console.log(data);
    return data.SearchResults;
  } catch {
    const fallbackRes = await fetch(
      `https://encar-proxy-main.onrender.com/api/catalog?count=true&q=${query}&sr=%7CModifiedDate%7C${offset}%7C20
`
    );

    const fallbackData = await fallbackRes.json();

    console.log(fallbackData);

    return {
      data: fallbackData.SearchResults,
      count: fallbackData.Count,
    };
  }
}
const CarsRow = async ({ searchParams }) => {
  const params = await searchParams;
  const action = params.action ? params.action : "(And.Hidden.N._.CarType.Y.)";
  const offset = params.page ? (params.page - 1) * 20 : "0";
  /*************  ✨ Windsurf Command 🌟  *************/
  const filters = {
    minPrice: params.priceMin ?? "0",
    maxPrice: params.priceMax ?? "1000000",
    minMileage: params.mileageMin ?? "0",
    maxMileage: params.mileageMax ?? "1000000",
    minYear: params.yearMin ?? "",
    maxYear: params.yearMax ?? "2030",
  };

  const string = generateFilterQuery(filters);
  const newString =
    action.slice(0, action.length - 1) +
    string +
    action.slice(action.length - 1);
  console.log(string);
  const { data, count } = await getCars(newString, offset);

  return (
    <div>
      <h1>Каталог</h1>
      <div>
        <div className="flex gap-2 mt-4">
          <Pagintaion count={count} />
        </div>
      </div>
      {data &&
        data.length > 0 &&
        data.map((item) => (
          <div key={item.Id}>
            <div className=" border-1 border-black overflow-hidden col-span-1  ">
              <div className="overflow-hidden h-50  flex justify-center items-center relative">
                <img
                  src={"https://ci.encar.com" + item.Photos[0]?.location}
                  alt=""
                />
              </div>
              <div className="flex flex-col gap-2 ">
                <div className="text-2xs font-bold border-b-2 h-24  pt-2 px-2 text-center">
                  {" "}
                  <span>
                    {item.Manufacturer} {item.Model} {item.Badge}{" "}
                    {item.Transmission}
                  </span>
                </div>
                <div className="flex justify-evenly">
                  <span>Год:</span>
                  <span>{item.Year} </span>
                  <span>
                    Пробег:{" "}
                    {item.Mileage && item.Mileage.toLocaleString("ru-RU")} км
                  </span>
                </div>

                <div className="flex justify-evenly">
                  <span>Цена:</span>
                  <span>{item.Price} вон</span>
                </div>
                <div className="flex justify-evenly h-12">
                  <span>Тип топлива:</span>

                  <span>{item.FuelType}</span>
                </div>
                <div>
                  <button
                    className="cursor-pointer self-stretch w-full mt-auto"
                    variant={"outline"}
                  >
                    <Link
                      target="_blank"
                      href={`/car/${item.Id}`}
                      className=" w-full"
                    >
                      Подробнеe
                    </Link>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
};
export default CarsRow;
