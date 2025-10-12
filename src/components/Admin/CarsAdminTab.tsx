"use client";

import Link from "next/link";
import { Car } from "@/lib/supabase";
import { convertNumber } from "@/utils/splitNumber";
import { Trash2, Edit3, Eye, ExternalLink } from "lucide-react";
import { useState } from "react";
import DeleteCarModal from "./DeleteCarModal";

interface CarsAdminTableProps {
  cars: Car[];
}

export default function CarsAdminTable({ cars }: CarsAdminTableProps) {
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    carId?: string;
  }>({
    isOpen: false,
  });

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200">
              <tr className="text-left text-sm font-bold text-gray-700">
                <th className="px-6 py-4">Авто</th>
                <th className="px-6 py-4">Год</th>
                <th className="px-6 py-4 text-right">Цена</th>
                <th className="px-6 py-4 text-right">Пробег</th>
                <th className="px-6 py-4 text-center">Статус</th>
                <th className="px-6 py-4 text-center">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cars.map((car) => (
                <tr
                  key={car.id}
                  className="hover:bg-blue-50 transition text-sm"
                >
                  {/* Авто */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {car.image_urls.length > 0 && (
                        <img
                          src={car.image_urls[0]}
                          alt={car.brand}
                          className="w-12 h-12 object-cover rounded-lg shadow"
                        />
                      )}
                      <div>
                        <p className="font-bold text-gray-900">
                          {car.brand} {car.model}
                        </p>
                        <p className="text-xs text-gray-500">
                          {car.fuel} • {car.transmission}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Год */}
                  <td className="px-6 py-4 text-gray-700 font-medium">
                    {car.year}
                  </td>

                  {/* Цена */}
                  <td className="px-6 py-4 text-right font-bold text-green-600">
                    {car.price.toLocaleString("ru")} ₩
                  </td>

                  {/* Пробег */}
                  <td className="px-6 py-4 text-right text-gray-600">
                    {car.mileage.toLocaleString()} км
                  </td>

                  {/* Статус */}
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${
                        car.status === "available"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {car.status === "available"
                        ? "✅ В продаже"
                        : "❌ Продано"}
                    </span>
                  </td>

                  {/* Действия */}
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-3">
                      {/* Просмотр */}
                      <Link
                        href={`/catalog/${car.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition"
                        title="Посмотреть на сайте"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {/* Редактировать */}
                      <Link
                        href={`/admin/cars/${car.id}/edit`}
                        className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-800 hover:bg-orange-50 p-2 rounded transition"
                        title="Редактировать"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>

                      {/* Удалить */}
                      <button
                        onClick={() =>
                          setDeleteModal({ isOpen: true, carId: car.id })
                        }
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модал удаления */}
      {deleteModal.isOpen && deleteModal.carId && (
        <DeleteCarModal
          carId={deleteModal.carId}
          onClose={() => setDeleteModal({ isOpen: false })}
        />
      )}
    </>
  );
}
