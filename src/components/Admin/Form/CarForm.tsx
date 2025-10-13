"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CarFormProps {
  form: {
    brand: string;
    model: string;
    badge: string;
    year: number;
    price: number;
    mileage: number;
    vin: string;
    fuel: string;
    transmission: string;
    description: string;
    status: "available" | "sold";
  };
  onChange: (field: string, value: string | number) => void;
}

const FUEL_TYPES = ["Бензин", "Дизель", "Гибрид", "Электро"];
const TRANSMISSIONS = ["Автомат", "Механика", "Вариатор"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 40 }, (_, i) => CURRENT_YEAR - i);

export default function CarForm({ form, onChange }: CarFormProps) {
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const finalValue = type === "number" ? parseInt(value) || 0 : value;
    onChange(name, finalValue);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* === ОСНОВНАЯ ИНФОРМАЦИЯ === */}
      <fieldset className="border-b pb-6">
        <legend className="text-xl font-bold text-gray-900 mb-4">
          🚗 Основная информация
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Марка */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Марка *
            </label>
            <Input
              name="brand"
              value={form.brand}
              onChange={handleChange}
              placeholder="Hyundai"
              required
            />
          </div>

          {/* Модель */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Модель *
            </label>
            <Input
              name="model"
              value={form.model}
              onChange={handleChange}
              placeholder="Solaris"
              required
            />
          </div>

          {/* Комплектация */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Комплектация
            </label>
            <Input
              name="badge"
              value={form.badge}
              onChange={handleChange}
              placeholder="SE, Premium, Sport..."
            />
          </div>

          {/* Год */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Год выпуска *
            </label>
            <select
              name="year"
              value={form.year}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* VIN */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              VIN
            </label>
            <Input
              name="vin"
              value={form.vin}
              onChange={handleChange}
              placeholder="KMHEC4A46CU123456"
            />
          </div>
        </div>
      </fieldset>

      {/* === ТЕХНИЧЕСКИЕ ХАРАКТЕРИСТИКИ === */}
      <fieldset className="border-b pb-6">
        <legend className="text-xl font-bold text-gray-900 mb-4">
          ⚙️ Технические характеристики
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Тип топлива */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Тип топлива *
            </label>
            <select
              name="fuel"
              value={form.fuel}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {FUEL_TYPES.map((fuel) => (
                <option key={fuel} value={fuel}>
                  {fuel}
                </option>
              ))}
            </select>
          </div>

          {/* Коробка передач */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Коробка передач *
            </label>
            <select
              name="transmission"
              value={form.transmission}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {TRANSMISSIONS.map((trans) => (
                <option key={trans} value={trans}>
                  {trans}
                </option>
              ))}
            </select>
          </div>

          {/* Пробег */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Пробег (км) *
            </label>
            <Input
              type="number"
              name="mileage"
              value={form.mileage}
              onChange={handleChange}
              placeholder="50000"
              required
              min="0"
            />
          </div>

          {/* Цена */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Цена (₩) *
            </label>
            <Input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="1000000"
              required
              min="0"
            />
          </div>
        </div>
      </fieldset>

      {/* === ДОПОЛНИТЕЛЬНО === */}
      <fieldset className="border-b pb-6">
        <legend className="text-xl font-bold text-gray-900 mb-4">
          📝 Дополнительно
        </legend>

        <div className="space-y-4">
          {/* Описание */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Описание
            </label>
            <Textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Состояние, особенности, история..."
              rows={4}
            />
          </div>

          {/* Статус */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Статус *
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="available">✅ В продаже</option>
              <option value="sold">❌ Продано</option>
            </select>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
