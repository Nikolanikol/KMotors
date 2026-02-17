import { XMLParser } from "fast-xml-parser";

export interface RssItem {
  guid: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  imageUrl?: string; // from <enclosure url="..." type="image/jpeg">
}

export function slugFromUrl(url: string): string {
  return url
    .replace(/^https?:\/\/(www\.)?/, "") // strip protocol + www.
    .replace(/\/$/, "")                   // strip trailing slash
    .replace(/[^a-z0-9]+/gi, "-")         // replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, "")             // strip leading/trailing dashes
    .toLowerCase();
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function fetchRssFeed(
  url: string,
  encoding: string = "utf-8"
): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; KMotors/1.0; +https://kmotors.ru)",
    },
    next: { revalidate: 0 }, // always fresh
  });

  if (!res.ok) {
    throw new Error(`RSS fetch failed: ${res.status} ${res.statusText}`);
  }

  const buffer = await res.arrayBuffer();
  return new TextDecoder(encoding).decode(buffer);
}

export function parseRssItems(xml: string): RssItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    cdataPropName: "__cdata",
  });

  const result = parser.parse(xml);

  // Navigate to items: result.rss.channel.item
  const channel = result?.rss?.channel;
  if (!channel) return [];

  // item may be a single object or an array
  const rawItems = Array.isArray(channel.item)
    ? channel.item
    : channel.item
    ? [channel.item]
    : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rawItems.map((item: any): RssItem => {
    // GUID may be an object: { "#text": "url", "@_isPermaLink": "true" }
    let guid: string;
    if (typeof item.guid === "object" && item.guid !== null) {
      guid = String(
        (item.guid as Record<string, unknown>)["#text"] ??
          (item.guid as Record<string, unknown>)["__cdata"] ??
          ""
      );
    } else {
      guid = String(item.guid ?? item.link ?? "");
    }

    // CDATA fields may be wrapped in __cdata
    const title =
      typeof item.title === "object"
        ? String(item.title.__cdata ?? "")
        : String(item.title ?? "");

    const description =
      typeof item.description === "object"
        ? String(item.description.__cdata ?? "")
        : String(item.description ?? "");

    const link =
      typeof item.link === "object"
        ? String(item.link.__cdata ?? "")
        : String(item.link ?? "");

    const pubDate = String(item.pubDate ?? "");

    // Extract image from <enclosure url="..." type="image/jpeg" />
    // fast-xml-parser returns enclosure as { "@_url": "...", "@_type": "image/jpeg" }
    let imageUrl: string | undefined;
    if (item.enclosure) {
      const enc = item.enclosure as Record<string, unknown>;
      const encUrl = enc["@_url"] ?? enc["url"];
      const encType = String(enc["@_type"] ?? enc["type"] ?? "");
      if (encUrl && encType.startsWith("image/")) {
        imageUrl = String(encUrl);
      }
    }

    return { guid, title, description, link, pubDate, imageUrl };
  });
}
