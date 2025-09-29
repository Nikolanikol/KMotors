// "use client";

import CarsRow from "@/components/Catalog/CarsRow";
import Filter from "@/components/Catalog/Filter/Filter";

//MY proxy string
// https://proxy-8mpk.onrender.com/proxy?url=https

//Basarish proxy string
// filterString
// https://encar-proxy-main.onrender.com/api/nav?count=true&q=(And.Hidden.N._.CarType.Y.)&inav=%7CMetadata%7CSort
// carString
// https://api.encar.com/search/car/list/general?count=true&q=${query}&inav=%7CMetadata%7CSort
async function getFilter() {
  const query = "(And.Hidden.N._.CarType.Y.)";

  try {
    const res = await fetch(
      `https://proxy-8mpk.onrender.com/proxy?url=https://api.encar.com/search/car/list/general?count=true&q=(And.Hidden.N._.CarType.Y.)&inav=%7CMetadata%7CSort`,
      {
        next: {
          revalidate: 120,
        },
      }
    );
    const data = await res.json();

    return data.iNav.Nodes.find(
      (i) => i.DisplayName === "국산여부"
    ).Facets.find((i) => i.IsSelected === true).Refinements.Nodes[0].Facets;
  } catch (error) {
    console.log(error);
  }
}
const fetchCatalog = async (query: string = "(And.Hidden.N._.CarType.Y.)") => {
  try {
    const res = await fetch(
      `https://api.encar.com/search/car/list/general?count=true&q=${query}&inav=%7CMetadata%7CSort`,
      {
        headers: {
          "user-agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
        },
      }
    )
      .then((data) => data.json())
      .then((res) => {
        const data = res.iNav.Nodes.find(
          (i) => i.DisplayName === "국산여부"
        ).Facets.find((i) => i.IsSelected === true).Refinements.Nodes[0].Facets;

        return data;
      });

    return res;
  } catch (error) {
    const res =
      fetch(`https://encar-proxy-main.onrender.com/api/nav?count=true&q=${"(And.Hidden.N._.CarType.N.)"}&inav=%7CMetadata%7CSort
`)
        .then((data) => data.json())

        .then((res) => {
          const data = res.iNav.Nodes.find(
            (i) => i.DisplayName === "국산여부"
          ).Facets.find((i) => i.IsSelected === true).Refinements.Nodes[0]
            .Facets;
          //   console.log(data);
          return data;
        });
    return res;
  }

  // .catch(()=>{
};
export default async function ({ searchParams }) {
  const filterData = await fetchCatalog(searchParams);

  //   console.log(filterData); // filter data
  return (
    <div className="grid grid-cols-6 gap-2">
      {/* каталога */}
      <div className="col-span-2 border-2 border-amber-800">
        <Filter />
      </div>
      <div className="col-span-4 border-2">
        <CarsRow searchParams={searchParams} />
      </div>
    </div>
  );
}
