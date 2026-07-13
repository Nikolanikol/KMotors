# Parts pages — design reference (каталог + карточка товара)

Справка для редизайна двух страниц: **каталог запчастей** и **страница товара**.
Собрано, чтобы не переисследовать код. Пути кликабельны от корня репозитория.

## Роуты и точки входа

| Страница | Роут | Файл |
|---|---|---|
| Каталог | `/[lang]/parts` | [src/app/[lang]/parts/page.tsx](../src/app/%5Blang%5D/parts/page.tsx) → рендерит `<PartsCatalog/>` |
| Карточка товара | `/[lang]/parts/[slug]` | [src/app/[lang]/parts/[slug]/page.tsx](../src/app/%5Blang%5D/parts/%5Bslug%5D/page.tsx) (server, 423 стр.) |

Слаг товара строится через `generatePartSlug` / `parsePartSlug` (`src/utils/partSlug.ts`): формат `name-partNumber` или по id.

## Дерево компонентов

Все секции лежат в **`src/app/parts/sections/`**:

**Каталог:**
- [PartsCatalog.tsx](../src/app/parts/sections/PartsCatalog.tsx) — **server**, грузит бренды/категории/fitment/первую страницу товаров (SSR для SEO), считает фасеты, передаёт в клиент.
- [PartsCatalogClient.tsx](../src/app/parts/sections/PartsCatalogClient.tsx) — **client, 901 стр.**, главный. URL-driven фильтры (`useSearchParams`), `useReducer`, пагинация, grid/list toggle, экспортирует все типы.
- [FilterSidebar.tsx](../src/app/parts/sections/FilterSidebar.tsx) — фильтры (бренды/категории/цена), `PendingFilters`.
- [ProductCard.tsx](../src/app/parts/sections/ProductCard.tsx) — карточка (grid + list варианты). **Главный элемент для редизайна каталога.**
- [QuickViewModal.tsx](../src/app/parts/sections/QuickViewModal.tsx) — быстрый просмотр.
- Вспомогательные: `Hero.tsx`, `About.tsx`, `PartsTopLinks.tsx`, `FloatingButtons.tsx`, `ContactForm.tsx`, `OrderModal.tsx`, `FitmentProductsGrid.tsx`.

**Карточка товара:**
- `page.tsx` (server) грузит товар + совместимость (`part_vehicles`) + похожие → рендерит:
- [ProductDetailClient.tsx](../src/app/parts/sections/ProductDetailClient.tsx) — **client, 729 стр.**, вся вёрстка карточки товара. **Главный файл для редизайна страницы товара.**

## Типы данных

Экспортируются из `PartsCatalogClient.tsx`:

```ts
type Product = {
  id: number; name_ru: string; name_en: string; name_ko: string | null;
  part_number: string; price_krw: number;
  brand_id: number | null; category_id: number | null; subcategory_id: number | null;
  image_url: string | null; is_new: boolean;
};
type Brand = { id: number; name: string; slug: string };
type Category = { id; slug; parent_id; ... };   // parent_id === null → верхняя категория, иначе подкатегория
type VehicleModel = { id; brand_id; name_en; name_ko };
type ModelChip = { name: string; count: number };
```

Таблица БД `parts_products` — полей больше (`seo_*`, `weight_kg`, `detail_url`, `official_name_ko`, `manufacturer`, `cross_refs`, `image_storage_url` и т.д.); в UI прокидывается подмножество выше. Данные каталога идут через API [/api/parts/products](../src/app/api/parts/products/route.ts) (пагинация 24/стр, фасетные counts). См. общий контекст данных в памяти [[parts-images-pipeline]].

## Дизайн-система

- **Tailwind + shadcn** (`components.json`: style **new-york**, baseColor neutral, RSC, cssVariables). UI-компоненты: `@/components/ui/*` (`Button`, `Input`, …). Иконки: **lucide-react**.
- **Два набора токенов** (важно!):
  - `axis.*` в [tailwind.config.js](../tailwind.config.js) — тёмная авто-тема основного сайта (black/charcoal/orange `#FF4500`). Каталог/товар её **почти не используют**.
  - **`--pn-*` в [src/app/globals.css](../src/app/globals.css) (~стр. 313)** — светлая тема именно для страниц запчастей. Карточки на белом (`bg-white`, `bg-gray-50`). Это то, что правим:

| Токен | Hex | Назначение |
|---|---|---|
| `--pn-orange` | `#F57C00` | акцент, цена, кнопки |
| `--pn-warm-orange` / `--pn-light-orange` | `#FF9800` / `#FFB74D` | вариации акцента |
| `--pn-deep-navy` | `#1B2B40` | заголовки/текст |
| `--pn-dark-navy` / `--pn-dark-gray` | `#2D3E50` / `#5A6573` | вторичный текст |
| `--pn-light-gray` / `--pn-medium-gray` | `#F0F2F5` / `#E0E4EA` | фоны/бордеры |
| `--pn-success` / `--pn-error` | `#4CAF50` / `#E53935` | статусы (в корзине / ошибка) |

Шрифт: **Inter** (`fontFamily.sans`). Карточки: `rounded-xl`, `shadow-sm→md`, hover `-translate-y-1`, изображение `aspect-square object-contain`, нет фото → иконка `Wrench` + `t("parts.catalog.noPhoto")`.

## Кросс-функциональное (учесть при редизайне)

- **i18n:** `react-i18next`, `const { t, i18n } = useTranslation()`, `lang = pathname.split("/")[1] || "ru"`. Языки: ru/en/ko/ka/ar. Часть подписей — inline-словари в компонентах (см. `CART_LABELS` в ProductCard), часть через `t("parts.catalog.*")`. **RTL:** есть `ar`.
- **Цена:** `formatUsd(price_krw, krwToUsd)` из `@/lib/pricing` (+ `PRICE_MARKUP`). Цены хранятся в KRW, показываются в USD.
- **Фото:** резолвятся через `@/lib/partImage` (`image_storage_url ?? image_url`). `<Image ... unoptimized/>` (next/image без оптимизации, т.к. внешний Storage).
- **Состояние каталога** живёт в URL (query-параметры фильтров) — при правках вёрстки не ломать связку `useSearchParams`/`router.replace`.
- **Корзина:** `useCartProductIds`, `onAddToCart` возвращает `Promise<boolean>`; неавторизованных редиректит на логин с `returnUrl`.

## С чего начинать редизайн

- Каталог: **`ProductCard.tsx`** (карточка) + сетка/тулбар в `PartsCatalogClient.tsx`.
- Товар: **`ProductDetailClient.tsx`**.
- Палитра/типографика: токены `--pn-*` в `globals.css`.
- Локально: `npm run dev` (или launch-конфиг `kmotors-dev`), страницы `/ru/parts` и `/ru/parts/<slug>`.
