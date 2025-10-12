import { Metadata } from "next";
import { getCarById, getAllCars } from "@/lib/db";
import AdminHeader from "@/components/Admin/AdminHeader";

import Link from "next/link";
import CarEditForm from "@/components/Admin/CarEditForm";

export const metadata: Metadata = {
  title: "Редактировать авто - KMotors Admin",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCarEditPage({ params }: PageProps) {
  const { id } = await params;
  let car = null;
  let error = null;

  try {
    car = await getCarById(id);
    if (!car) {
      error = "Авто не найдено";
    }
  } catch (err) {
    error = "Ошибка при загрузке авто";
    console.error(err);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <main className="container mx-auto py-8 px-4">
        {/* Назад */}
        <Link
          href="/admin/cars"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-6 transition"
        >
          ← Вернуться к списку
        </Link>

        <h1 className="text-3xl font-bold mb-6 text-gray-900">
          ✏️ Редактировать авто
        </h1>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            ⚠️ {error}
          </div>
        ) : car ? (
          <CarEditForm initialCar={car} />
        ) : null}
      </main>
    </div>
  );
}

// ==================== ТАКЖЕ СОЗДАЙ ЭТУ СТРАНИЦУ ====================
