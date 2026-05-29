# Post-migration: что изменить в коде после 001

## После выполнения SQL-миграции нужно:

### 1. Добавить brand_id в тип Product (PartsCatalogClient.tsx)

Найти:
```ts
export type Product = {
  id: number;
  name_ru: string;
  ...
  is_new: boolean;
};
```

Заменить на:
```ts
export type Product = {
  id: number;
  name_ru: string;
  name_en: string;
  name_ko: string | null;
  part_number: string;
  price_krw: number;
  brand_id: number | null;          // ← НОВОЕ
  category_id: number | null;
  subcategory_id: number | null;
  image_url: string | null;
  is_new: boolean;
};
```

### 2. Обновить SELECT в PartsCatalog.tsx

Добавить `brand_id` в select продуктов:
```ts
.select(
  "id, name_ru, name_en, name_ko, part_number, price_krw, brand_id, category_id, subcategory_id, image_url, is_new"
)
```

### 3. Упростить pre-computation brandProductIdsMap

Заменить сложную fitment-цепочку на прямую фильтрацию по brand_id:
```ts
// БЫЛО: fitment → vehicle_models → brand (только ~200 продуктов)
// СТАЛО: прямой фильтр → все 6204 продукта

brands.forEach((brand) => {
  // Прямая фильтрация — без fitment вообще
  brandProductIdsMap[brand.slug] = products
    .filter((p) => p.brand_id === brand.id)
    .map((p) => p.id);
  
  // ... остальная логика brandModelChips остаётся через fitment
});
```

Это ОДИН проход O(n) вместо двух-трёх.

### Итог после патча

| | До миграции | После миграции |
|---|---|---|
| Продуктов при выборе Kia | ~100-200 (только с fitment) | Все Kia-продукты из 6204 |
| Скорость brand-фильтра | O(fitment) + join | O(products) один проход |
| Fitment нужен для | Brand + Model | Только Model |
