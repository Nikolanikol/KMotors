const ENCAR_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";

const PRIMARY_TIMEOUT_MS = 8000;
const FALLBACK_TIMEOUT_MS = 20000;

export interface ModelsResponce {
  Count: number;
  DisplayValue: string;
  Value: string;
  Action: string;
  Metadata: {
    EngName: string[];
    Code: string[];
  };
}

export interface GenerationResponce {
  Count: number;
  DisplayValue: string;
  Value: string;
  Action: string;
  Metadata: {
    EngName: string[];
    Code: string[];
  };
}

/** Фасет дерева iNav. Форма одинакова на всех уровнях. */
export interface NavFacet {
  Count: number;
  DisplayValue: string;
  Value: string;
  Action: string;
  Metadata: {
    EngName: string[];
    Code: string[];
  };
}

/**
 * Encar пишет это в 세부등급, когда у машины нет отдельного уровня оснащения:
 * всё описание уехало в 등급 (объём, топливо, привод). Так у ПОЛОВИНЫ выдачи —
 * на выборке в 600 машин 24% несут эту строку, ещё 27% не имеют поля вовсе.
 * Пункт обязан оставаться в списке: спрятать его — значит сделать половину
 * каталога недостижимой через фильтр.
 */
export const NO_TRIM = "(세부등급 없음)";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = any;

/** Спуск по дереву iNav: отечественные → марка → (модель). Любой обрыв → []. */
function drill(payload: Node, depth: number): Node[] {
  let facets: Node[] | undefined = payload?.iNav?.Nodes?.find(
    (i: Node) => i?.DisplayName === "국산여부"
  )?.Facets;

  for (let i = 0; i < depth; i++) {
    facets = facets?.find((f: Node) => f?.IsSelected === true)?.Refinements?.Nodes?.[0]?.Facets;
  }

  return Array.isArray(facets) ? facets : [];
}

async function fetchNav(query: string, depth: number): Promise<Node[]> {
  const path = `count=true&q=${query}&inav=%7CMetadata%7CSort`;

  try {
    const res = await fetch(`https://api.encar.com/search/car/list/general?${path}`, {
      headers: { "user-agent": ENCAR_UA },
      signal: AbortSignal.timeout(PRIMARY_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return drill(await res.json(), depth);
  } catch {
    try {
      const res = await fetch(`https://encar-proxy-main.onrender.com/api/nav?${path}`, {
        signal: AbortSignal.timeout(FALLBACK_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return drill(await res.json(), depth);
    } catch {
      // Фильтр без опций лучше, чем unhandled rejection и сломанный каталог.
      return [];
    }
  }
}

/**
 * Уровни дерева iNav у Encar (проверено на живом API 27.08.2026, Hyundai Grandeur):
 *
 *   1  제조사      марка                Hyundai
 *   2  모델그룹     модельный ряд         그랜저          → fetchModels
 *   3  모델        поколение             그랜저 (GN7)    → fetchGeneration
 *   4  등급필터     топливо и привод      가솔린 2WD      → fetchBadgeGroup
 *   5  등급        объём/топливо/привод  2.5 가솔린 2WD  → fetchBadge
 *   6  세부등급     КОМПЛЕКТАЦИЯ          캘리그래피       → fetchBadgeDetail
 *
 * ⚠️ Уровни не перепрыгиваются: чтобы получить фасеты уровня N, в запросе должен
 * быть выбран уровень N−1. Отсюда цепочка выпадашек — это не выбор дизайна, а
 * форма самого дерева.
 *
 * ⚠️ Глубже шестого уровня ничего нет — проверено, `Refinements` пустые.
 */
export const fetchModels = (query: string): Promise<ModelsResponce[]> =>
  fetchNav(query, 2) as Promise<ModelsResponce[]>;

export const fetchGeneration = (query: string): Promise<GenerationResponce[]> =>
  fetchNav(query, 3) as Promise<GenerationResponce[]>;

export const fetchBadgeGroup = (query: string): Promise<NavFacet[]> =>
  fetchNav(query, 4) as Promise<NavFacet[]>;

export const fetchBadge = (query: string): Promise<NavFacet[]> =>
  fetchNav(query, 5) as Promise<NavFacet[]>;

export const fetchBadgeDetail = (query: string): Promise<NavFacet[]> =>
  fetchNav(query, 6) as Promise<NavFacet[]>;
