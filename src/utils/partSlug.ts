// Канонический slug — только идентификатор (артикул или id-N), без названия.
// Названия нестабильны (переводы правятся) и в URL почти не влияют на ранжирование,
// а запчасти ищут по каталожному номеру. Старые URL вида "PN--name" получают 301.
// Сигнатура сохранена для совместимости со старыми вызовами (name/lang игнорируются).
export function generatePartSlug(
  partNumber: string | null,
  _name?: string | null,
  _lang?: "ru" | "en" | "ko",
  id?: number
): string {
  return partNumber || (id ? `id-${id}` : "unknown");
}

export function parsePartSlug(slug: string): {
  partNumber: string | null;
  productId: number | null;
  nameSlug: string;
} {
  // Канонический формат: "51712-B4000" или "id-25"
  // Старый формат (301 на канонический): "51712-B4000--tormoznoy-disk", "id-25--k8-..."
  const [identifier, ...rest] = slug.split("--");
  const nameSlug = rest.join("--");

  if (!identifier) {
    return { partNumber: null, productId: null, nameSlug: "" };
  }

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
  return (text ?? "")
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
