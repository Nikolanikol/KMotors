import { redirect } from "next/navigation";
import { data } from "./data";

// app/catalog/[brand]/page.tsx
const brandMapping = {
  hyundai: "(And.Hidden.N._.(C.CarType.Y._.Manufacturer.현대.))",
  kia: "(And.Hidden.N._.(C.CarType.Y._.Manufacturer.기아.))",
  genesis: "(And.Hidden.N._.(C.CarType.Y._.Manufacturer.제네시스.))",
};

export async function generateStaticParams() {
  return data.map((item) => ({
    brand: item.Action,
  }));
}

export default function BrandPage({ params }) {
  redirect(`/catalog?action=${[params.brand]}`);
}
