import { CarSearchParams } from "./Types";

const generateFilterQuery = ({
  minPrice = "",
  maxPrice = "",
  minMileage = "",
  maxMileage = "",
  minYear = "",
  maxYear = "",
}: {
  minPrice?: number | string;
  maxPrice?: number | string;
  minMileage?: number | string;
  maxMileage?: number | string;
  minYear?: number | string;
  maxYear?: number | string;
}) => {
  let price = "";
  if (!maxPrice && !minPrice) price = "";
  else price = `_.Price.range(${minPrice}..${maxPrice}).`;

  let mileage = "";
  if (!maxMileage && !minMileage) mileage = "";
  else mileage = `_.Mileage.range(${minMileage}..${maxMileage}).`;

  let year = "";
  if (!minYear && !maxYear) year = "";
  else
    year = `_.Year.range(${minYear + "00"}..${maxYear ? maxYear + "99" : ""}).`;

  return mileage + price + year + "";
};


function getString(params: CarSearchParams) {
    console.log(params.action)

    const action =
    params.action ? params.action : "(And.Hidden.N._.CarType.Y.)";
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
  console.log(string);
  return action.slice(0, action.length - 1) +
    string +
    action.slice(action.length - 1);
}

export {getString}