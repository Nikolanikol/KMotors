// "use client";

import CarsRow from "@/components/Catalog/CarsRow";
import CarCard from "@/components/Catalog/CatalogCarCard";
import Filter from "@/components/Catalog/Filter";
import { Car } from "lucide-react";

// import React, { Suspense } from "react";
// import { useSearchParams } from "next/navigation";

// function IframeContent() {
//   const searchParams = useSearchParams();
//   const manufacture = searchParams.get("manufacture");
//   const mode = process.env.NEXT_PUBLIC_DEPLOY_MODE;

//   const iframeSrc =
//     mode === "production"
//       ? `https://carnex.vercel.app${
//           manufacture
//             ? `?manufacture=${manufacture}`
//             : "?manufacture=(And.Hidden.N._.(C.CarType.Y._.Manufacturer.현대.))"
//         }`
//       : `http://localhost:5173${
//           manufacture
//             ? `?manufacture=${manufacture}`
//             : "?manufacture=(And.Hidden.N._.(C.CarType.Y._.Manufacturer.현대.))"
//         }`;

//   return (
//     <iframe
//       src={iframeSrc}
//       className="w-full min-h-screen"
//       loading="lazy"
//       title="Каталог"
//     />
//   );
// }

// export default function Pages() {
//   return (
//     <div className="min-h-screen">
//       <Suspense
//         fallback={<div className="p-4 text-gray-500">Загрузка каталога...</div>}
//       >
//         <IframeContent />
//       </Suspense>
//     </div>
//   );
// }

// ==========================================
// https://encar-proxy-main.onrender.com/api/catalog?count=true&q=(And.Hidden.N._.CarType.Y.)&sr=%7CModifiedDate%7C%7C20
// https://encar-proxy-main.onrender.com/api/nav?count=true&q=(And.Hidden.N._.CarType.Y.)&inav=%7CMetadata%7CSort

async function getFilter() {
  const query = "(And.Hidden.N._.CarType.Y.)";
  try {
    const res = await fetch(
      `https://encar-proxy-main.onrender.com/api/nav?count=true&q=(And.Hidden.N._.CarType.Y.)&inav=%7CMetadata%7CSort`,
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
export default async function ({ searchParams }) {
  const filterData = await getFilter();
  return (
    <div>
      <div>
        <Filter filterData={filterData} />
      </div>
      <div>
        <CarsRow searchParams={searchParams} />
      </div>
    </div>
  );
}
