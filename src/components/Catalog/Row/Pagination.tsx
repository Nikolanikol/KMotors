"use client";
import React, { useEffect, useState, useTransition } from "react";
import { Pagination as AntdPagination } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
export const Pagination = ({ count }: { count: number }) => {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState(1);
  const handlePageChange = (newPage: number | string) => {
    setCurrentPage(Number(newPage));
    const newParams = new URLSearchParams(params.toString());
    newParams.set("page", newPage.toString());
    startTransition(() => {
      router.push(`/catalog?${newParams.toString()}`);
    });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [count]);
  return (
    <div>
      {/* {isPending && (
        <div className=" z-20 absolute bg-gray-300 opacity-30 border-2 border-black">
          ⏳
        </div>
      )} */}
      <AntdPagination
        onChange={(e) => handlePageChange(e)}
        total={count}
        pageSize={20}
        current={currentPage}
        className={clsx(isPending && "opacity-20")}
      />
    </div>
  );
};
