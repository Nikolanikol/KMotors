"use client";

import { useState, useRef } from "react";
import { Upload, AlertCircle, Loader2 } from "lucide-react";
import ImageGallery from "./ImageGallery";

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ImageUploader({
  images,
  onImagesChange,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadDragActive, setIsUploadDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Валидация файла
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "❌ Только JPEG, PNG и WebP разрешены";
    }

    if (file.size > MAX_FILE_SIZE) {
      return `❌ Файл слишком большой (макс ${MAX_FILE_SIZE / 1024 / 1024}MB)`;
    }

    if (images.length >= 20) {
      return "❌ Максимум 20 фото на одно авто";
    }

    return null;
  };

  // Загрузка одного файла
  const uploadFile = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }

    setIsUploading(true);
    setUploadError("");
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setUploadError(data.error || "❌ Ошибка загрузки");
        return;
      }

      const { url } = await res.json();

      // Добавляем новое фото
      onImagesChange([...images, url]);
      setUploadSuccess(true);

      // Очищаем успех через 2 секунды
      setTimeout(() => setUploadSuccess(false), 2000);
    } catch (err) {
      setUploadError("❌ Ошибка подключения");
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  // Drag & Drop для загрузки
  const handleUploadDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsUploadDragActive(true);
  };

  const handleUploadDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsUploadDragActive(false);
  };

  const handleUploadDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleUploadDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsUploadDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Область загрузки */}
      <div
        onDragEnter={handleUploadDragEnter}
        onDragLeave={handleUploadDragLeave}
        onDragOver={handleUploadDragOver}
        onDrop={handleUploadDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isUploadDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-gray-700 font-medium">⏳ Загружаем фото...</p>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium mb-2">
              📸 Перетащите фото сюда или нажмите для выбора
            </p>
            <p className="text-sm text-gray-500 mb-4">
              JPEG, PNG, WebP • Макс {MAX_FILE_SIZE / 1024 / 1024}MB • До 20
              фото
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition disabled:opacity-50"
            >
              Выбрать файл
            </button>
          </>
        )}
      </div>

      {/* Ошибка */}
      {uploadError && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{uploadError}</p>
        </div>
      )}

      {/* Успех */}
      {uploadSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          ✅ Фото успешно загружено!
        </div>
      )}

      {/* Галерея */}
      <ImageGallery
        images={images}
        onImagesChange={onImagesChange}
        onImageRemove={(index) => {
          onImagesChange(images.filter((_, i) => i !== index));
        }}
      />
    </div>
  );
}
