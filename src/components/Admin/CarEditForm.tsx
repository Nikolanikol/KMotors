"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Car } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import CarForm from "./Form/CarForm";
import ImageUploader from "./Form/ImageUploader";

interface CarEditFormProps {
  initialCar: Car | null;
  isNew?: boolean;
}

export default function CarEditForm({
  initialCar,
  isNew = false,
}: CarEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Состояние формы
  const [form, setForm] = useState({
    brand: initialCar?.brand || "",
    model: initialCar?.model || "",
    badge: initialCar?.badge || "",
    year: initialCar?.year || new Date().getFullYear(),
    price: initialCar?.price || 0,
    mileage: initialCar?.mileage || 0,
    vin: initialCar?.vin || "",
    fuel: initialCar?.fuel || "Бензин",
    transmission: initialCar?.transmission || "Автомат",
    description: initialCar?.description || "",
    image_urls: initialCar?.image_urls || [],
    status: initialCar?.status || ("available" as const),
  });

  // Обновить поле формы
  const handleFormChange = (field: string, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Обновить изображения
  const handleImagesChange = (images: string[]) => {
    setForm((prev) => ({
      ...prev,
      image_urls: images,
    }));
  };

  // Валидация
  const validateForm = (): string | null => {
    if (!form.brand.trim()) return "⚠️ Укажите марку";
    if (!form.model.trim()) return "⚠️ Укажите модель";
    if (form.year < 1900 || form.year > new Date().getFullYear() + 1)
      return "⚠️ Неверный год";
    if (form.price <= 0) return "⚠️ Цена должна быть больше 0";
    if (form.mileage < 0) return "⚠️ Пробег не может быть отрицательным";
    if (form.image_urls.length === 0) return "⚠️ Добавьте хотя бы одно фото";
    return null;
  };

  // Отправить форму
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const method = isNew ? "POST" : "PUT";
      const url = isNew ? "/api/cars" : `/api/cars/${initialCar?.id}`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "❌ Ошибка при сохранении");
        return;
      }

      setSuccess(true);

      // Пересчитываем SSG для каталога
      if (!isNew && initialCar) {
        try {
          const secret = process.env.NEXT_PUBLIC_REVALIDATE_SECRET || "";

          // Пересчет страницы конкретного авто
          await fetch(
            `/api/revalidate?path=/catalog/${initialCar.id}&secret=${secret}`,
            { method: "POST" }
          ).catch((err) => console.error("Revalidate car page error:", err));

          // Пересчет каталога
          await fetch(`/api/revalidate?path=/catalog&secret=${secret}`, {
            method: "POST",
          }).catch((err) => console.error("Revalidate catalog error:", err));
        } catch (err) {
          console.error("SSG revalidation error:", err);
        }
      }

      // Редирект через 1.5 сек
      setTimeout(() => {
        router.push("/admin/cars");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError("❌ Ошибка подключения");
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* === СООБЩЕНИЯ === */}

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-4 rounded-lg">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 bg-green-50 border-2 border-green-200 text-green-700 px-4 py-4 rounded-lg">
          <CheckCircle className="w-6 h-6 flex-shrink-0" />
          <p className="font-medium">
            ✅ Авто {isNew ? "добавлено" : "обновлено"} успешно! Сейчас
            перенаправим...
          </p>
        </div>
      )}

      {/* === ФОРМА ДАННЫХ === */}
      <CarForm form={form} onChange={handleFormChange} />

      {/* === ЗАГРУЗКА ФОТО === */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <ImageUploader
          images={form.image_urls}
          onImagesChange={handleImagesChange}
        />
      </div>

      {/* === КНОПКИ === */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />⏳ Сохраняем...
            </>
          ) : (
            <>💾 {isNew ? "Добавить авто" : "Сохранить изменения"}</>
          )}
        </Button>

        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg transition disabled:opacity-50"
        >
          ← Отменить
        </button>
      </div>
    </form>
  );
}
