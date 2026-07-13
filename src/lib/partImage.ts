/**
 * Product image resolution.
 *
 * Every catalog photo was mirrored from the original supplier hotlink into our
 * Supabase Storage (`image_storage_url`) and de-branded there (PARTSRO banner +
 * logo removed). The frontend still keys off `image_url`, so at each fetch site
 * we coalesce: prefer our clean Storage copy, fall back to the original hotlink
 * when a copy is missing.
 *
 * Add `image_storage_url` to the `parts_products` select, then map rows through
 * `withCleanImage` before handing them to the UI.
 */

/** Columns a row must expose for image resolution. */
export interface WithPartImage {
  image_url?: string | null;
  image_storage_url?: string | null;
}

/** Preferred display URL: clean Storage copy first, original hotlink otherwise. */
export function resolvePartImage(row: WithPartImage): string | null {
  return row.image_storage_url || row.image_url || null;
}

/** Return a copy of the row with `image_url` set to the preferred display URL. */
export function withCleanImage<T extends WithPartImage>(row: T): T {
  const clean = row.image_storage_url;
  return clean ? { ...row, image_url: clean } : row;
}
