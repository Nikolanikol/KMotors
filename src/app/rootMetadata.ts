import type { Metadata, Viewport } from "next";

// Метаданные и viewport общие для всех трёх корневых layout: их три, потому
// что <html lang> обязан приходить из сегмента [lang], а корневой layout его
// не видит. Держать три копии этого объекта — верный способ их рассинхронить.

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#b67749",
};
export const metadata: Metadata = {
  metadataBase: new URL("https://www.kmotors.shop"),
  title: {
    default: "K-Axis — авто из Кореи | Hyundai, Kia, Genesis",
    template: "%s | K-Axis",
  },
  description:
    "K-Axis — покупка и доставка автомобилей из Южной Кореи. Hyundai, Kia, Genesis. Честные цены, без посредников.",
  openGraph: {
    title: "K-Axis — авто из Кореи | Hyundai, Kia, Genesis",
    description: "K-Axis — покупка и доставка автомобилей из Южной Кореи. Hyundai, Kia, Genesis. Честные цены, без посредников.",
    type: "website",
    // ⚠️ images здесь НЕ задавать. Значение из корневого layout наследуется
    // всеми страницами и перекрывает файловую конвенцию `opengraph-image.tsx`
    // на каждой из них разом. Раньше тут стоял hero-bg.jpg — размытое стоковое
    // фото склада без бренда.
  },
  keywords: [
    "авто из Кореи", "купить авто из Кореи", "kmotors",
    "Hyundai из Кореи", "Kia из Кореи", "Genesis из Кореи",
    "Korean cars", "buy car from Korea", "Korean car dealer",
    "한국 중고차", "კორეული მანქანები", "سيارات كورية",
  ],
  other: {
    "yandex-verification": "f71551035d1c4fbb",
  },
};
