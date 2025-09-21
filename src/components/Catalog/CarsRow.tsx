import Link from "next/link";

async function getCars(query) {
  try {
    const res = await fetch(
      `https://encar-proxy-main.onrender.com/api/catalog?count=true&q=${query}&sr=%7CModifiedDate%7C%7C20
`
    );
    const data = await res.json();
    console.log(data);
    return data;
  } catch (error) {
    console.log(error);
  }
}
const CarsRow = async ({ searchParams }) => {
  const action = searchParams.action;
  console.log("Параметр action:", action);

  const data = await getCars(action);
  console.log(data);
  return (
    <div>
      <h1>Каталог</h1>
      {data.SearchResults.map((item, i) => (
        <div key={i.Id}>
          <div
            key={item.Id}
            className=" border-1 border-black overflow-hidden col-span-1  "
          >
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
                  Пробег: {item.Mileage && item.Mileage.toLocaleString("ru-RU")}{" "}
                  км
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
