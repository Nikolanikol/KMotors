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

export { generateFilterQuery };
