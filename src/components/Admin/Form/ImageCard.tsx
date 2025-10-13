"use client";

import { X, GripVertical } from "lucide-react";
import Image from "next/image";

interface ImageCardProps {
  url: string;
  index: number;
  totalImages: number;
  onRemove: () => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  isDragging: boolean;
}

export default function ImageCard({
  url,
  index,
  totalImages,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}: ImageCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
      className={`relative group cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? "opacity-50 scale-95" : "hover:shadow-lg"
      } rounded-lg overflow-hidden shadow-md bg-gray-100`}
    >
      {/* Фото */}
      <div className="relative w-full h-48 bg-gray-200">
        <Image
          src={url}
          alt={`Car image ${index + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 200px"
        />
      </div>

      {/* Оверлей с номером */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs font-bold">
        #{index + 1}
      </div>

      {/* Кнопки управления */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
        {/* Перемещение */}
        <div
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition flex items-center gap-1"
          title="Перетаскивайте для сортировки"
        >
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Удаление */}
        <button
          onClick={onRemove}
          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition"
          title="Удалить фото"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Индекс снизу */}
      <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
        {index + 1}/{totalImages}
      </div>
    </div>
  );
}
