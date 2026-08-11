import ru from "@/locales/ru/customs.json";
import en from "@/locales/en/customs.json";
import ka from "@/locales/ka/customs.json";
import ar from "@/locales/ar/customs.json";

/**
 * Доступ к словарю калькуляторов ВНЕ React.
 *
 * `generateMetadata` живёт вне рендер-дерева, инстанса i18next там нет —
 * ровно как у карточки авто, которая по той же причине читает cars.json
 * напрямую. Хук сюда не годится.
 */
const DICTS: Record<string, unknown> = { ru, en, ka, ar };

/** Число листьев словаря — им меряется полнота перевода. */
function countLeaves(node: unknown): number {
  if (typeof node === "string") return 1;
  if (!node || typeof node !== "object") return 0;
  return Object.values(node).reduce<number>(
    (sum, value) => sum + countLeaves(value),
    0,
  );
}

const RU_LEAVES = countLeaves(ru);

/**
 * Заполнен ли словарь для языка ПОЛНОСТЬЮ.
 *
 * Гейт открывает сразу две вещи: индексацию страницы и её место в сайтмапе
 * (`sitemap-main.xml`). Поэтому проверка идёт на паритет с русским, а не на
 * «объект непустой»: половина словаря — это страница, где часть строк осталась
 * ключами, и уходит она в индекс ровно так же. Когда язык допереведут,
 * индексация включится сама, без правок в разметке.
 *
 * ka/ar намеренно остаются пустыми: они рендерятся английским текстом через
 * фолбэк i18next, но в индекс не идут — под их URL лежал бы дубликат /en.
 */
export function hasCustomsDictionary(lang: string): boolean {
  return countLeaves(DICTS[lang]) >= RU_LEAVES;
}

/**
 * Значение по точечному ключу; undefined, если ключа нет нигде.
 *
 * Падение на английский повторяет `fallbackLng: "en"` у i18next — иначе
 * `generateMetadata` для ka/ar отдавал бы пустой title при живом английском
 * тексте на самой странице.
 */
export function customsText(lang: string, key: string): string | undefined {
  return pick(DICTS[lang], key) ?? pick(DICTS.en, key);
}

function pick(dict: unknown, key: string): string | undefined {
  const value = key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object"
          ? (node as Record<string, unknown>)[part]
          : undefined,
      dict,
    );
  return typeof value === "string" ? value : undefined;
}
