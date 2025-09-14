"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function IframeContent() {
  const searchParams = useSearchParams();
  const manufacture = searchParams.get("manufacture");
  const mode = process.env.NEXT_PUBLIC_DEPLOY_MODE;

  const iframeSrc =
    mode === "production"
      ? `https://carnex.vercel.app${
          manufacture ? `?manufacture=${manufacture}` : ""
        }`
      : `http://localhost:5173${
          manufacture ? `?manufacture=${manufacture}` : ""
        }`;

  return (
    <iframe
      src={iframeSrc}
      className="w-full min-h-screen"
      loading="lazy"
      title="Каталог"
    />
  );
}

export default function Pages() {
  return (
    <div className="min-h-screen">
      <Suspense
        fallback={<div className="p-4 text-gray-500">Загрузка каталога...</div>}
      >
        <IframeContent />
      </Suspense>
    </div>
  );
}

// "use client";
// import React from "react";
// import { useSearchParams } from "next/navigation";
// const Pages = () => {
//   const mode = process.env.NEXT_PUBLIC_DEPLOY_MODE;

//   const manufacture = useParams();
//   // console.log(manufacture); //здесь приняли параметр  теперь надо его прокинуть в iframe
//   return (
//     <div className="min-h-screen ">
//       {" "}
//       <iframe
//         src={
//           mode === "production"
//             ? `https://carnex.vercel.app?manufacture=${manufacture}`
//             : `http://localhost:5173?manufacture=${manufacture}`
//         }
//         className="w-full min-h-screen "
//         loading="lazy"
//         title="Каталог"
//       />{" "}
//     </div>
//   );
// };

// export default Pages;

// function useParams(): string | null {
//   const searchParams = useSearchParams();
//   const manufacture = searchParams.get("manufacture");
//   if (manufacture && manufacture != "null") return manufacture;
//   return null;
// }
