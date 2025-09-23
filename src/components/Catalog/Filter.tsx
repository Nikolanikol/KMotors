"use client";
import React, { useEffect } from "react";
import { SlidingButton } from "../ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
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
    console.log(data);

    return data.iNav.Nodes.find(
      (i) => i.DisplayName === "국산여부"
    ).Facets.find((i) => i.IsSelected === true).Refinements.Nodes[0].Facets;
  } catch (error) {
    console.log(error);
  }
}
const Filter = ({ filterData }) => {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const handleChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(params.toString());
    newParams.set(key, value);
    startTransition(() => {
      router.push(`/catalog?${newParams.toString()}`);
    });
  };
  console.log(filterData);
  return (
    <div className="flex flex-row gap-3">
      Filter
      {filterData.map((item) => (
        <SlidingButton
          key={item.Count}
          onClick={() => handleChange("action", item.Action)}
        >
          {item.Value}
        </SlidingButton>
      ))}
      {isPending && (
        <div className="mt-4 animate-pulse text-gray-500">⏳ Обновляем...</div>
      )}
    </div>
  );
};

export default Filter;
