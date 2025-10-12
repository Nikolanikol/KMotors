"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Car } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Upload,
  X,
  Loader2,
  ImagePlus,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface CarEditFormProps {
  initialCar: Car | null;
  isNew?: boolean;
}

const FUEL_TYPES = ["Бензин", "Дизель", "Гибрид", "Электро"];
const TRANSMISSIONS = ["Автомат", "Механика", "Вариатор"];
const MAX_IMAGES = 20;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function CarEditForm({
  initialCar,
  isNew = false,
}: CarEditFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(
    new Set()
  );
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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
    status: initialCar?.status || "available",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 0 : value,
    }));
  };

  // Загрузка одного файла
  const handleSingleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("❌ Только изображения разрешены (JPEG, PNG, WebP)");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError("❌ Файл слишком большой (макс 5MB)");
      return;
    }

    // Добавляем файл в uploading set
    const fileId = `${file.name}-${Date.now()}`;
    setUploadingImages((prev) => new Set([...prev, fileId]));
    setUploadError("");

    try {
      console.log(`📤 Загружаем: ${file.name}`);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("❌ Ошибка:", data);
        setUploadError(`❌ Ошибка: ${data.error || "Неизвестная ошибка"}`);
        return;
      }

      console.log("✅ Загружено:", data.url);

      // Проверяем лимит фото
      if (form.image_urls.length >= MAX_IMAGES) {
        setUploadError(`❌ Достигнут лимит фото (макс ${MAX_IMAGES})`);
        return;
      }

      setForm((prev) => ({
        ...prev,
        image_urls: [...prev.image_urls, data.url],
      }));
    } catch (err) {
      console.error("❌ Ошибка подключения:", err);
      setUploadError("❌ Ошибка подключения");
    } finally {
      setUploadingImages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  // Загрузка нескольких файлов
  const handleMultipleImageUpload = async (files: FileList) => {
    const filesArray = Array.from(files);

    // Проверка количества файлов
    const totalImages = form.image_urls.length + filesArray.length;
    if (totalImages > MAX_IMAGES) {
      setUploadError(
        `❌ Слишком много фото. Всего может быть максимум ${MAX_IMAGES}. Сейчас: ${form.image_urls.length} + новых: ${filesArray.length}`
      );
      return;
    }

    // Загружаем все файлы параллельно
    console.log(`📦 Загружаем ${filesArray.length} фото...`);
    const uploadPromises = filesArray.map((file) =>
      handleSingleImageUpload(file)
    );

    await Promise.all(uploadPromises);
  };

  // Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleMultipleImageUpload(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleMultipleImageUpload(e.target.files);
      // Очищаем input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    if (!form.brand || !form.model) {
      setError("Марка и модель обязательны");
      setLoading(false);
      return;
    }

    try {
      const method = isNew ? "POST" : "PUT";
      const url = isNew ? "/api/cars" : `/api/cars/${initialCar?.id}`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Ошибка при сохранении");
        return;
      }

      setSuccess(true);

      // Пересчитываем SSG (on-demand ISR)
      if (!isNew && initialCar) {
        const revalidateSecret = process.env.NEXT_PUBLIC_REVALIDATE_SECRET;

        if (revalidateSecret) {
          await fetch(
            `/api/revalidate?path=/catalog/${initialCar.id}&secret=${revalidateSecret}`,
            { method: "POST" }
          ).catch(console.error);

          await fetch(
            `/api/revalidate?path=/catalog&secret=${revalidateSecret}`,
            { method: "POST" }
          ).catch(console.error);
        }
      }

      setTimeout(() => {
        router.push("/admin/cars");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError("Ошибка подключения");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ============ ОСНОВНАЯ ИНФОРМАЦИЯ ============ */}
        <fieldset>
          <legend className="text-xl font-bold mb-6 text-gray-900">
            📋 Основная информация
          </legend>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Марка *
              </label>
              <Input
                name="brand"
                value={form.brand}
                onChange={handleInputChange}
                placeholder="Hyundai"
                required
                disabled={loading}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Модель *
              </label>
              <Input
                name="model"
                value={form.model}
                onChange={handleInputChange}
                placeholder="Solaris"
                required
                disabled={loading}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Комплектация
              </label>
              <Input
                name="badge"
                value={form.badge}
                onChange={handleInputChange}
                placeholder="SE, GL, GLS..."
                disabled={loading}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                VIN
              </label>
              <Input
                name="vin"
                value={form.vin}
                onChange={handleInputChange}
                placeholder="KMHEC4A44EU..."
                disabled={loading}
                className="w-full font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Год выпуска *
              </label>
              <Input
                type="number"
                name="year"
                value={form.year}
                onChange={handleInputChange}
                min="1990"
                max={new Date().getFullYear() + 1}
                required
                disabled={loading}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Цена (KRW) *
              </label>
              <Input
                type="number"
                name="price"
                value={form.price}
                onChange={handleInputChange}
                placeholder="15000000"
                required
                disabled={loading}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Пробег (км) *
              </label>
              <Input
                type="number"
                name="mileage"
                value={form.mileage}
                onChange={handleInputChange}
                placeholder="50000"
                required
                disabled={loading}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Тип топлива *
              </label>
              <select
                name="fuel"
                value={form.fuel}
                onChange={handleInputChange}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FUEL_TYPES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Коробка передач *
              </label>
              <select
                name="transmission"
                value={form.transmission}
                onChange={handleInputChange}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TRANSMISSIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Статус *
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleInputChange}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="available">✅ В продаже</option>
                <option value="sold">❌ Продано</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Описание
            </label>
            <Textarea
              name="description"
              value={form.description}
              onChange={handleInputChange}
              placeholder="Дополнительная информация об авто..."
              disabled={loading}
              rows={4}
              className="w-full"
            />
          </div>
        </fieldset>

        {/* ============ ЗАГРУЗКА ФОТО (СРАЗУ НЕСКОЛЬКО) ============ */}
        <fieldset>
          <legend className="text-xl font-bold mb-6 text-gray-900">
            📸 Фотографии
          </legend>

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            💡 Можешь загрузить сразу несколько фото (макс{" "}
            {MAX_IMAGES - form.image_urls.length} осталось)
          </div>

          {/* Drag & Drop зона */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-700 font-medium">
              Перетащи фото сюда или нажми для выбора
            </p>
            <p className="text-sm text-gray-500 mt-1">
              JPEG, PNG, WebP до 5MB (можно несколько файлов)
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileInputChange}
              disabled={
                uploadingImages.size > 0 ||
                loading ||
                form.image_urls.length >= MAX_IMAGES
              }
              multiple
              className="hidden"
            />
          </div>

          {/* Статус загрузки */}
          {uploadingImages.size > 0 && (
            <div className="flex items-center justify-center gap-2 mt-4 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Загружаем {uploadingImages.size} фото...
            </div>
          )}

          {uploadError && (
            <div className="flex items-center gap-2 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {uploadError}
            </div>
          )}

          {/* Список загруженных фото */}
          {form.image_urls.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-3">
                ✅ Загруженные фото ({form.image_urls.length}/{MAX_IMAGES}):
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {form.image_urls.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={url}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg shadow"
                    />
                    <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition disabled:opacity-50"
                        title="Удалить фото"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute top-1 right-1 bg-gray-900 text-white px-2 py-1 rounded text-xs font-bold">
                      #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </fieldset>

        {/* ============ ОШИБКИ И СООБЩЕНИЯ ============ */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />✅ Успешно
            сохранено! Перенаправляем...
          </div>
        )}

        {/* ============ КНОПКИ ============ */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={loading || uploadingImages.size > 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 transition"
          >
            {loading
              ? "⏳ Сохраняем..."
              : isNew
              ? "➕ Создать авто"
              : "💾 Сохранить изменения"}
          </Button>

          <Button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-medium disabled:opacity-50 transition"
          >
            Отменить
          </Button>
        </div>
      </form>
    </div>
  );
}
