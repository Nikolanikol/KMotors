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

export const fetchModels = (query: string): Promise<ModelsResponce[]> =>
  fetchNav(query, 2) as Promise<ModelsResponce[]>;

export const fetchGeneration = (query: string): Promise<GenerationResponce[]> =>
  fetchNav(query, 3) as Promise<GenerationResponce[]>;
