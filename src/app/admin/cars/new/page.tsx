import AdminHeader from "@/components/Admin/AdminHeader";
import CarEditForm from "@/components/Admin/CarEditForm";
import { Metadata } from "next";
import Link from "next/link";

export const metadata_new: Metadata = {
  title: "Добавить авто - KMotors Admin",
  robots: { index: false },
};

export default async function AdminCarNewPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <main className="container mx-auto py-8 px-4">
        <Link
          href="/admin/cars"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-6 transition"
        >
          ← Вернуться к списку
        </Link>

        <h1 className="text-3xl font-bold mb-6 text-gray-900">
          ➕ Добавить новое авто
        </h1>

        <CarEditForm initialCar={null} isNew={true} />
      </main>
    </div>
  );
}
