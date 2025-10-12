import Link from "next/link";
import { Metadata } from "next";
import { getAllCars } from "@/lib/db";
import AdminHeader from "@/components/Admin/AdminHeader";
import CarsAdminTable from "@/components/Admin/CarsAdminTab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Управление авто - KMotors Admin",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function AdminCarsPage() {
  let cars = [];
  let error = null;

  try {
    cars = await getAllCars();
  } catch (err) {
    error = "Ошибка при загрузке авто";
    console.error(err);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <main className="container mx-auto py-8 px-4">
        {/* Заголовок с кнопкой */}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              🚗 Управление авто
            </h1>
            <p className="text-gray-600 mt-1">
              Всего в каталоге: {cars.length} авто
            </p>
          </div>
          <Link
            href="/admin/cars/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition transform hover:scale-105"
          >
            ➕ Добавить авто
          </Link>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
            ⚠️ {error}
          </div>
        )}

        {/* Пусто */}
        {cars.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-6">
              📭 Пока авто не добавлены
            </p>
            <Link
              href="/admin/cars/new"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg inline-block transition"
            >
              Добавить первое авто
            </Link>
          </div>
        ) : (
          <CarsAdminTable cars={cars} />
        )}
      </main>
    </div>
  );
}
