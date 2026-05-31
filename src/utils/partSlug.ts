export function generatePartSlug(
  partNumber: string | null,
  name: string,
  lang: "ru" | "en" | "ko" = "ru",
  id?: number
): string {
  // Выбираем нужное имя в зависимости от языка
  const nameToSlug = lang === "ru" ? name : name;

  // Конвертируем в ASCII-slug (кириллица → транслит вручную)
  const slug = slugify(nameToSlug);

  // Если part_number отсутствует, используем ID как fallback
  const identifier = partNumber || (id ? `id-${id}` : "unknown");

  // Формат: "51712-B4000--tormoznoy-disk" или "id-25--k8-..."
  return `${identifier}--${slug}`;
}

export function parsePartSlug(slug: string): {
  partNumber: string | null;
  productId: number | null;
  nameSlug: string;
} {
  // "51712-B4000--tormoznoy-disk" → { partNumber: "51712-B4000", nameSlug: "tormoznoy-disk" }
  // "id-25--k8-..." → { productId: 25, nameSlug: "k8-..." }
  const parts = slug.split("--");
  if (parts.length < 2) {
    return { partNumber: null, productId: null, nameSlug: "" };
  }

  const identifier = parts[0];
  const nameSlug = parts.slice(1).join("--");

  // Проверяем это ID или part_number
  if (identifier.startsWith("id-")) {
    const id = parseInt(identifier.substring(3), 10);
    return { partNumber: null, productId: isNaN(id) ? null : id, nameSlug };
  }

  return { partNumber: identifier, productId: null, nameSlug };
}

// Простой транслит кириллицы + slugify
const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function transliterate(text: string): string {
  return text
    .toLowerCase()
    .split("")
    .map((char) => CYRILLIC_TO_LATIN[char] || char)
    .join("");
}

export function slugify(text: string): string {
  // 1. Транслитерируем кириллицу
  let result = transliterate(text);

  // 2. Удаляем спецсимволы (кроме дефиса)
  result = result.replace(/[^\w\s-]/g, "");

  // 3. Заменяем пробелы на дефисы
  result = result.replace(/\s+/g, "-");

  // 4. Удаляем множественные дефисы
  result = result.replace(/-+/g, "-");

  // 5. Убираем дефисы в начале и конце
  result = result.replace(/^-+|-+$/g, "");

  return result;
}
