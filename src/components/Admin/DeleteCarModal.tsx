"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

interface DeleteCarModalProps {
  carId: string;
  onClose: () => void;
}

export default function DeleteCarModal({
  carId,
  onClose,
}: DeleteCarModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/cars/${carId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Ошибка при удалении");
        return;
      }

      // Успешно удалено
      onClose();
      router.refresh();
    } catch (err) {
      setError("Ошибка подключения");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 animate-in">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <h2 className="text-xl font-bold text-gray-900">Удалить авто?</h2>
        </div>

        <p className="text-gray-600 mb-6">
          Это действие нельзя отменить. Авто и все его фото будут удалены из
          системы.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            ⚠️ {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50 transition"
          >
            Отменить
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 transition"
          >
            {loading ? "⏳ Удаляем..." : "🗑️ Удалить"}
          </button>
        </div>
      </div>
    </div>
  );
}
