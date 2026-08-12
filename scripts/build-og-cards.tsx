/**
 * Сборка og-карточек в готовые JPEG.
 *
 * Запуск:  npx tsx scripts/build-og-cards.tsx
 * Один раздел:  ONLY=catalog npx tsx scripts/build-og-cards.tsx
 *
 * В базу НЕ ходит и сеть не трогает — читает исходники из `public/`, пишет в
 * `public/og/`. Единственный скрипт в этой папке, который безопасно запускать
 * без оглядки на прод.
 *
 * ⚠️ Почему заранее, а не в рантайме: `ImageResponse` отдаёт только PNG, а PNG
 * с фотографией весит 740–970 КБ при лимите превью у WhatsApp ~300 КБ. Тот же
 * кадр в JPEG q82 — 55 КБ. `sharp` нужен только здесь и в `package.json`
 * намеренно НЕ добавлен: он приходит транзитивно с Next, а трогать лок-файл в
 * этом репозитории дорого (см. про npm 10/11 в CLAUDE.md). Прод от `sharp` не
 * зависит — он отдаёт уже собранные файлы.
 *
 * Результат коммитится в гит: карточки меняются, только когда мы их меняем,
 * и их видно глазами в диффе.
 */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { OG_SIZE, PANEL, OgPhotoCard, OgScreenshotCard, ogCopy } from "@/lib/ogCard";

// `next/og` не резолвится голым Node вне сборки Next — берём реализацию прямо.
const require_ = createRequire(import.meta.url);
const { ImageResponse } = require_("next/dist/server/og/image-response.js");
const sharp = require_("sharp");

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public/og");
const QUALITY = 82;
const WHATSAPP_LIMIT = 300 * 1024;

/** Языки те же два, что знает `ogCopy`: шрифт Satori не держит ka/ar. */
const LANGS = ["ru", "en"] as const;

type Section = Parameters<typeof ogCopy>[0];
type Crop = { left: number; top: number; width: number; height: number };
type Source =
  /** Фотография во всю карточку, текст поверх шторы. */
  | { kind: "photo"; src: string }
  /** Скриншот интерфейса панелью справа, кроп в пикселях ИСХОДНИКА. */
  | { kind: "screenshot"; src: string; crop?: Crop };

/**
 * Раздел → исходник (путь от корня репозитория).
 *
 * ⚠️ `public/screenshots/screen1..4.png` НЕ ГОДЯТСЯ: они сняты до ребрендинга,
 * там красно-оранжевая тема — кнопки «Показать» и «Подробнее» красные, цены
 * красные. Поставить их в og значит вернуть в соцсети ровно ту палитру, ради
 * замены которой всё это и делается. Нужны свежие снимки бронзового интерфейса.
 *
 * Для `screenshot` кроп задаётся в пикселях исходника и берётся так, чтобы в
 * панель попали одна-две карточки авто МАСШТАБОМ, БЛИЗКИМ К НАТУРАЛЬНОМУ.
 * Ужимать снимок целиком нельзя — см. комментарий у `OgScreenshotCard`.
 * Без `crop` берётся окно справа по высоте панели — почти наверняка мимо,
 * подогнать по первому же прогону.
 */
const SOURCES: Partial<Record<Section, Source>> = {
  // TODO: подставить свежие бронзовые скриншоты, когда владелец их положит.
  // Исходники лежат в `assets/og-src/` — НЕ в `public/`: они по несколько
  // мегабайт, раздавать их наружу незачем, в og уходит только сборка.
  // home:    { kind: "screenshot", src: "assets/og-src/home.png",    crop: { left: 0, top: 0, width: 820, height: 690 } },
  // catalog: { kind: "screenshot", src: "assets/og-src/catalog.png", crop: { left: 0, top: 0, width: 820, height: 690 } },

  // Запчасти пока на фотографии склада — снимок каталога запчастей не присылали.
  parts: { kind: "photo", src: "public/images/about-mobis.jpg" },

  // blog и calculator — без картинки: подходящего исходника нет, у них
  // остаётся текстовая карточка, которую рисует маршрут через OgCard.
};

async function prepare(source: Source): Promise<string> {
  const abs = path.join(ROOT, source.src);

  if (source.kind === "photo") {
    const buf = await readFile(abs);
    const ext = path.extname(source.src).toLowerCase();
    const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  }

  const img = sharp(abs);
  const meta = await img.metadata();

  // Кроп приводится ровно к размеру панели, поэтому в карточке не нужен
  // overflow: hidden — у Satori с ним свои сложности.
  const crop: Crop =
    source.crop ??
    {
      left: Math.max(0, (meta.width ?? PANEL.width) - Math.round(PANEL.width * 1.3)),
      top: 0,
      width: Math.min(meta.width ?? PANEL.width, Math.round(PANEL.width * 1.3)),
      height: Math.min(meta.height ?? PANEL.height, Math.round(PANEL.height * 1.3)),
    };

  const out = await img
    .extract(crop)
    .resize(PANEL.width, PANEL.height, { fit: "cover", position: "left top" })
    .jpeg({ quality: 92 })
    .toBuffer();

  return `data:image/jpeg;base64,${out.toString("base64")}`;
}

async function build() {
  await mkdir(OUT_DIR, { recursive: true });
  const only = process.env.ONLY;
  const entries = Object.entries(SOURCES) as [Section, Source][];

  if (entries.length === 0) {
    console.log("В SOURCES пусто — собирать нечего. Добавьте исходники и повторите.");
    return;
  }

  let total = 0;
  for (const [section, source] of entries) {
    if (only && only !== section) continue;

    let asset: string;
    try {
      asset = await prepare(source);
    } catch (e) {
      console.error(`  ✗ ${section}: не прочитать ${source.src} — ${(e as Error).message}`);
      continue;
    }

    for (const lang of LANGS) {
      const copy = ogCopy(section, lang);
      const card =
        source.kind === "photo" ? (
          <OgPhotoCard {...copy} photo={asset} />
        ) : (
          <OgScreenshotCard {...copy} shot={asset} />
        );

      const png = Buffer.from(await new ImageResponse(card, { ...OG_SIZE }).arrayBuffer());
      const jpeg = await sharp(png).jpeg({ quality: QUALITY, mozjpeg: true }).toBuffer();

      await writeFile(path.join(OUT_DIR, `${section}-${lang}.jpg`), jpeg);
      total += jpeg.length;

      const warn = jpeg.length > WHATSAPP_LIMIT ? "  ⚠️ БОЛЬШЕ 300 КБ — WhatsApp не покажет" : "";
      console.log(`  public/og/${section}-${lang}.jpg  ${(jpeg.length / 1024).toFixed(0)} КБ${warn}`);
    }
  }

  console.log(`\nвсего ${(total / 1024).toFixed(0)} КБ`);
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
