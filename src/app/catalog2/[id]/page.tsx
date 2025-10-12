import { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { getCarById, getAllCars } from "@/lib/db";
import { Car } from "@/lib/supabase";
import {
  Fuel,
  Gauge,
  Settings,
  DollarSign,
  MapPin,
  Calendar,
  Zap,
} from "lucide-react";
import CarouselLight from "@/components/StaticCatalog/Carousel/Carousel";
// import ViewCounter from "@/components/Catalog/CarIdPage/ViewCounter";

interface PageProps {
  params: Promise<{ id: string }>;
}

// ⭐ SSG: Генерируем все страницы при сборке
export async function generateStaticParams() {
  try {
    const cars = await getAllCars();
    return cars.map((car) => ({ id: car.id }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export const revalidate = 86400; // ISR: пересчет раз в 24 часа

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const car = await getCarById(id);

  if (!car) {
    return {
      title: "Автомобиль не найден | KMotors",
      description: "К сожалению, этот автомобиль не найден",
    };
  }

  const carName = `${car.brand} ${car.model} ${car.badge || ""} ${car.year}`;
  const price = car.price.toLocaleString();
  const description = `${carName} - Пробег: ${car.mileage.toLocaleString()} км. Цена: ${price} вон. Купить корейский автомобиль на KMotors`;

  return {
    title: `${carName} - ${price} вон | KMotors`,
    description,
    openGraph: {
      title: `${carName}`,
      description,
      images: car.image_urls.length > 0 ? [car.image_urls[0]] : [],
      type: "website",
      url: `https://kmotors.shop/catalog/${car.id}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${carName}`,
      description,
      images: car.image_urls.length > 0 ? [car.image_urls[0]] : [],
    },
  };
}

async function getCarData(id: string) {
  try {
    return await getCarById(id);
  } catch (error) {
    console.error("Error fetching car:", error);
    return null;
  }
}

export default async function CarDetailPage({ params }: PageProps) {
  const { id } = await params;
  const car = await getCarData(id);

  if (!car) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            😞 Авто не найдено
          </h1>
          <p className="text-gray-600 mb-8">
            К сожалению, этот автомобиль больше недоступен
          </p>
          <Link
            href="/catalog2"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition"
          >
            ← Вернуться к каталогу
          </Link>
        </div>
      </div>
    );
  }

  const carName = `${car.brand} ${car.model} ${car.badge || ""}`;
  const mainPhoto = car.image_urls[0] || "/noimage.png";

  // JSON-LD для SEO
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: carName,
    image: car.image_urls,
    description: car.description || carName,
    brand: {
      "@type": "Brand",
      name: car.brand,
    },
    offers: {
      "@type": "Offer",
      url: `https://kmotors.shop/catalog/${car.id}`,
      priceCurrency: "KRW",
      price: car.price,
      availability:
        car.status === "available"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/UsedCondition",
    },
  };

  const formatPrice = (price: number) => {
    return (price / 1000000).toFixed(1) + "M";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Script
        id="product-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ========== HEADER ========== */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/catalog2"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold transition"
          >
            ← Вернуться к каталогу
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* ========== СТАТУС ========== */}
        {car.status === "sold" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-bold">
              ❌ Этот автомобиль уже продан
            </p>
          </div>
        )}
        {/* ========== ЗАГОЛОВОК И ЦЕНА ========== */}
        <div className="mb-8">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                {car.brand} {car.model}
              </h1>
              {car.badge && (
                <p className="text-lg text-gray-600 mb-4">
                  Комплектация: {car.badge}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Цена</p>
              <p className="text-4xl font-bold text-blue-600">
                {car.price.toLocaleString()}₩
              </p>
              {/* <p className="text-sm text-gray-500">
                {car.price.toLocaleString()} ₩
              </p> */}
            </div>
          </div>

          {/* Основные параметры */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-t border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600 uppercase">Год</p>
                <p className="text-lg font-bold text-gray-900">{car.year}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Gauge className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-xs text-gray-600 uppercase">Пробег</p>
                <p className="text-lg font-bold text-gray-900">
                  {car.mileage.toLocaleString()} км
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Fuel className="w-6 h-6 text-orange-600" />
              <div>
                <p className="text-xs text-gray-600 uppercase">Топливо</p>
                <p className="text-lg font-bold text-gray-900">{car.fuel}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-purple-600" />
              <div>
                <p className="text-xs text-gray-600 uppercase">КПП</p>
                <p className="text-lg font-bold text-gray-900">
                  {car.transmission}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* ========== ФОТОГРАФИИ ========== */}
        {/* Галерея фото */}
        {car.image_urls.length > 0 && <CarouselLight photos={car.image_urls} />}
        {/* ========== ОПИСАНИЕ ========== */}
        {car.description && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Описание</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {car.description}
            </p>
          </div>
        )}
        {/* ========== ИНФОРМАЦИЯ ========== */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Информация об авто
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Левая колонка */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-lg">📋</span> Основные данные
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Марка</p>
                  <p className="font-bold text-gray-900">{car.brand}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Модель</p>
                  <p className="font-bold text-gray-900">{car.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Год выпуска</p>
                  <p className="font-bold text-gray-900">{car.year}</p>
                </div>
                {car.vin && (
                  <div>
                    <p className="text-sm text-gray-600">VIN</p>
                    <p className="font-mono font-bold text-gray-900 break-all">
                      {car.vin}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Правая колонка */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-lg">🔧</span> Технические характеристики
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Пробег</p>
                  <p className="font-bold text-gray-900">
                    {car.mileage.toLocaleString()} км
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Тип топлива</p>
                  <p className="font-bold text-gray-900">{car.fuel}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Коробка передач</p>
                  <p className="font-bold text-gray-900">{car.transmission}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Статус</p>
                  <p
                    className={`font-bold ${
                      car.status === "available"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {car.status === "available" ? "✅ В продаже" : "❌ Продано"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* ========== CTA КНОПКА ========== */}
        <div className="flex gap-4 mb-8">
          <a
            href="https://t.me/kmotorsshop"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 active:scale-95 text-center"
          >
            💬 Написать в Telegram
          </a>
          <a
            href="https://wa.me/+821077324344"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 active:scale-95 text-center"
          >
            💬 WhatsApp
          </a>
        </div>
        {/* ========== РЕКОМЕНДАЦИИ ========== */}
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            ❓ Есть вопросы?
          </h3>
          <p className="text-gray-700 mb-4">
            Свяжитесь с нами через Telegram или WhatsApp для консультации и
            дополнительной информации об этом автомобиле.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              ✅ Оригинальные документы
            </span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              🚚 Доставка по миру
            </span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              🛡️ Проверка качества
            </span>
          </div>
        </div>
      </div>

      {/* ⭐ ViewCounter - отправляет просмотр на сервер */}
      {/* <ViewCounter carId={car.id} /> */}
    </div>
  );
}
