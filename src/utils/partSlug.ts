export function generatePartSlug(
  partNumber: string,
  name: string,
  lang: "ru" | "en" | "ko" = "ru"
): string {
  // Выбираем нужное имя в зависимости от языка
  const nameToSlug = lang === "ru" ? name : name;

  // Конвертируем в ASCII-slug (кириллица → транслит вручную)
  const slug = slugify(nameToSlug);

  // Формат: "51712-B4000--tormoznoy-disk"
  return `${partNumber}--${slug}`;
}

export function parsePartSlug(slug: string): {
  partNumber: string;
  nameSlug: string;
} {
  // "51712-B4000--tormoznoy-disk" → { partNumber: "51712-B4000", nameSlug: "tormoznoy-disk" }
  const parts = slug.split("--");
  if (parts.length < 2) {
    return { partNumber: slug, nameSlug: "" };
  }

  const partNumber = parts[0];
  const nameSlug = parts.slice(1).join("--");

  return { partNumber, nameSlug };
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
