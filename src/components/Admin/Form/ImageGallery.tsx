"use client";

import { useState } from "react";
import ImageCard from "./ImageCard";

interface ImageGalleryProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  onImageRemove: (index: number) => void;
}

export default function ImageGallery({
  images,
  onImagesChange,
  onImageRemove,
}: ImageGalleryProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Обработчик начала перетаскивания
  const handleGalleryDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
    setDraggedIndex(index);
  };

  // Обработчик над элементом
  const handleGalleryDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // Обработчик отпускания
  const handleGalleryDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    const draggedIndexStr = e.dataTransfer.getData("text/plain");
    const fromIndex = parseInt(draggedIndexStr, 10);

    if (fromIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    // Создаем новый массив с переставленными элементами
    const newImages = [...images];
    const [draggedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    onImagesChange(newImages);
    setDraggedIndex(null);
  };

  if (images.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-gray-500">📭 Фото не добавлены</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">
        📸 Галерея ({images.length})
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((url, index) => (
          <ImageCard
            key={`${url}-${index}`}
            url={url}
            index={index}
            totalImages={images.length}
            onRemove={() => onImageRemove(index)}
            onDragStart={handleGalleryDragStart}
            onDragOver={handleGalleryDragOver}
            onDrop={handleGalleryDrop}
            isDragging={draggedIndex === index}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-4">
        💡 Перетаскивайте фото для изменения порядка. Первое фото будет
        основным.
      </p>
    </div>
  );
}
