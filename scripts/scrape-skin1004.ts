import Database from "better-sqlite3";
import path from "path";

const API_URL =
  "https://www.skin1004.com/collections/all/products.json?limit=250";
const DB_PATH = path.resolve(__dirname, "../data/skin1004.db");

interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  sku: string | null;
  available: boolean;
  grams: number;
  option1: string | null;
  option2: string | null;
  option3: string | null;
}

interface ShopifyImage {
  id: number;
  src: string;
  position: number;
  width: number;
  height: number;
  alt: string | null;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  tags: string[];
  body_html: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

function createSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id            INTEGER PRIMARY KEY,
      title         TEXT NOT NULL,
      handle        TEXT NOT NULL UNIQUE,
      vendor        TEXT,
      product_type  TEXT,
      body_html     TEXT,
      created_at    TEXT,
      updated_at    TEXT,
      published_at  TEXT
    );

    CREATE TABLE IF NOT EXISTS variants (
      id                INTEGER PRIMARY KEY,
      product_id        INTEGER NOT NULL REFERENCES products(id),
      title             TEXT,
      price             REAL NOT NULL,
      compare_at_price  REAL,
      sku               TEXT,
      available         INTEGER NOT NULL DEFAULT 1,
      grams             INTEGER DEFAULT 0,
      option1           TEXT,
      option2           TEXT,
      option3           TEXT
    );

    CREATE TABLE IF NOT EXISTS images (
      id          INTEGER PRIMARY KEY,
      product_id  INTEGER NOT NULL REFERENCES products(id),
      src         TEXT NOT NULL,
      position    INTEGER,
      width       INTEGER,
      height      INTEGER,
      alt         TEXT
    );

    CREATE TABLE IF NOT EXISTS product_tags (
      product_id  INTEGER NOT NULL REFERENCES products(id),
      tag         TEXT NOT NULL,
      PRIMARY KEY (product_id, tag)
    );

    CREATE INDEX IF NOT EXISTS idx_variants_product ON variants(product_id);
    CREATE INDEX IF NOT EXISTS idx_images_product ON images(product_id);
    CREATE INDEX IF NOT EXISTS idx_tags_tag ON product_tags(tag);
  `);
}

async function fetchProducts(): Promise<ShopifyProduct[]> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const data = await res.json();
  return data.products;
}

function insertProducts(db: Database.Database, products: ShopifyProduct[]) {
  const insertProduct = db.prepare(`
    INSERT OR REPLACE INTO products
      (id, title, handle, vendor, product_type, body_html, created_at, updated_at, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertVariant = db.prepare(`
    INSERT OR REPLACE INTO variants
      (id, product_id, title, price, compare_at_price, sku, available, grams, option1, option2, option3)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertImage = db.prepare(`
    INSERT OR REPLACE INTO images
      (id, product_id, src, position, width, height, alt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTag = db.prepare(`
    INSERT OR IGNORE INTO product_tags (product_id, tag) VALUES (?, ?)
  `);

  const tx = db.transaction((items: ShopifyProduct[]) => {
    let variantCount = 0;
    let imageCount = 0;
    let tagCount = 0;

    for (const p of items) {
      insertProduct.run(
        p.id, p.title, p.handle, p.vendor, p.product_type,
        p.body_html, p.created_at, p.updated_at, p.published_at
      );

      for (const v of p.variants) {
        insertVariant.run(
          v.id, p.id, v.title,
          parseFloat(v.price),
          v.compare_at_price ? parseFloat(v.compare_at_price) : null,
          v.sku, v.available ? 1 : 0, v.grams,
          v.option1, v.option2, v.option3
        );
        variantCount++;
      }

      for (const img of p.images) {
        insertImage.run(
          img.id, p.id, img.src, img.position,
          img.width, img.height, img.alt
        );
        imageCount++;
      }

      for (const tag of p.tags) {
        insertTag.run(p.id, tag);
        tagCount++;
      }
    }

    return { products: items.length, variantCount, imageCount, tagCount };
  });

  return tx(products);
}

async function main() {
  const fs = await import("fs");
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  console.log("Fetching products from skin1004.com...");
  const products = await fetchProducts();
  console.log(`Got ${products.length} products`);

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  createSchema(db);
  const stats = insertProducts(db, products);

  console.log("\n=== Done ===");
  console.log(`Products:  ${stats.products}`);
  console.log(`Variants:  ${stats.variantCount}`);
  console.log(`Images:    ${stats.imageCount}`);
  console.log(`Tags:      ${stats.tagCount}`);
  console.log(`\nDB saved to: ${DB_PATH}`);

  db.close();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
