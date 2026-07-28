CLAUDE.md

Guidance for Claude Code in this repository.

What this is

Full-stack e-commerce platform on kmotors.shop (displayed brand: K-Axis, soft rebrand — domain unchanged). Two catalogs: used Korean cars (Encar-sourced) and genuine Hyundai/Kia/Genesis OEM parts. In-house AI SEO pipeline, PayPal checkout, Telegram-driven ops. Full feature list and env vars: README.md.

Commands
bash
npm run dev          # next dev --turbopack
npm run dev:clean    # wipe .next, then dev
npm run build        # next build --turbopack
npm run lint         # eslint
npm run create-admin # tsx scripts/create-admin.ts
Verification — REQUIRED before considering any change done

Build does NOT catch errors: next.config.ts sets eslint.ignoreDuringBuilds: true and typescript.ignoreBuildErrors: true. A passing build proves nothing. Always run:

bash
npm run lint
npx tsc --noEmit

There is no test suite — never assume npm test works.

Застрял — сообщи сразу, не молчи

lint + tsc обязательны всегда. Всё остальное (браузерная проверка, дев-сервер, скриншоты, скрипты, внешние API) — если инструмент виснет, отваливается по таймауту или требует обходных путей, ОСТАНОВИСЬ после ВТОРОЙ неудачной попытки и напиши пользователю: что не работает, что уже сделано, какие есть варианты. Не уходи в молчаливый цикл обходных решений — это сжигает время и деньги, а пользователь узнаёт об этом постфактум.

Типовые случаи: панель браузера скрыта (`document.visibilityState === "hidden"` → скриншоты чёрные — проверять через DOM/read_page или попросить открыть панель), дев-сервер не поднимается, Encar/Supabase не отвечают.

Правило простое: сама работа важнее её демонстрации. Код готов и проверен через lint/tsc — доложи об этом и о проблеме с проверкой, дальше решает пользователь.

Deployment — READ FIRST
Every push to main triggers an automatic production redeploy (Coolify on the VPS). git push to main is a deploy action, not a save action.
The Supabase database is self-hosted on the same VPS and is the LIVE production database. .env in this repo points at it. Any SQL, any data script, any supabase CLI command touches production directly. There is no separate staging DB.
Rules
NEVER git push — not to main, not to any branch — without explicit user confirmation in the current session. Commit locally, then stop and report.
All work happens on feature branches. Never commit directly to main.
Navigation: use Serena tools (find_symbol, find_referencing_symbols, etc.) instead of Grep/Read for locating code. Fall back to Grep only if Serena is unavailable.
Never run scripts/ or sql/ data scripts without explicit user confirmation — they hit the production Supabase. They are run via npx tsx --env-file=.env scripts/x.ts, most are resumable/idempotent (progress logs like scripts/.image-migration.log); read the script's header comment for env vars (LIMIT, CONCURRENCY, DELAY_MS) first.
Never modify DB schema, RLS policies, or run destructive SQL without explicit user confirmation.
parts_staging is off-limits to app code — ingestion buffer only. App reads parts_products.
Do not extend parts_fitment / parts_vehicle_models (legacy). All new fitment work targets part_vehicles + vehicles.
Never read image_url directly — always resolve images via src/lib/partImage.ts (resolvePartImage / withCleanImage; prefers image_storage_url).
Prices — PARTS: stored in KRW, displayed in USD via src/lib/pricing.ts (formatUsd, fixed PRICE_MARKUP). Never format/convert prices ad hoc.
Prices — CARS: different model, pricing.ts does NOT apply. Headline price in the car card is KRW (won); ₽ (ru) / $ (other langs) are shown below as reference, converted with the LIVE rate from src/utils/getCurrencyRates.ts (24h cache, safe fallbacks). Never hardcode an FX rate — a stale constant in generateMetadata was overstating the RU snippet price by ~12%.
Canonical + hreflang always go through makeAlternates(lang, path) (src/lib/seo.ts). trailingSlash is false, so a path of "/" produces a URL that 308-redirects and Google discards the tag — the home page passes "" instead. Same rule in src/app/sitemap-main.xml/route.ts (buildUrl) and in internal links to the language root.
ko locale is disabled (301 → /en). LOCALIZATION_GUIDE.md still lists it — that doc is stale; trust src/lib/lang.ts / src/lib/i18n.ts (SUPPORTED = ['ru','en','ka','ar']).
SEO pipeline never touches live data before the Telegram approval gate — do not change that invariant.
Encar fetches must never throw. Every call into api.encar.com goes through a helper that catches, falls back, and returns a typed empty result (getCars in src/components/Catalog/Row/utils/service.ts, fetchNav in src/components/Catalog/Filter/FilterService/index.ts). Always: AbortSignal.timeout (8s primary / 20s the Render proxy, which cold-starts), res.ok check, try/catch around the FALLBACK too — an unguarded fallback was what took the whole catalog page down. Never add a bare fetch to Encar in a component.
Architecture
Routing & i18n
src/app/[lang]/... — all public pages. [lang] ∈ ru | en | ka | ar (src/lib/lang.ts).
No-prefix URL resolution cascade: cookie → Accept-Language → cf-ipcountry → default ru (src/lib/lang.ts, applied in middleware.ts).
i18n is per-request, not globally bundled: src/lib/i18n.ts seeds an i18next instance with active language + en fallback only (avoids hydration mismatches and bundle bloat). Translations: src/locales/<lang>/{common,cars}.json.
middleware.ts also does: bot/Electron-scraper blocking, legacy parts-URL 308 redirects (PN--name-slug → PN), /admin cookie auth gate, first-party analytics dispatch to /api/track, 410s for stale indexed paths, and server-side Supabase session refresh.
Cars catalog (Encar-backed)
Entry: /[lang]/catalog (listing) and /[lang]/catalog/[id] (card). Data is fetched live from api.encar.com per request via src/lib/vehicle.ts (fetchVehicleData); there is no local mirror of car data.
Sold car = Encar 404 = fetchVehicleData returns null. generateMetadata then returns a generic title plus robots noindex. This is the ONLY lever: notFound() on this route still streams HTTP 200 (loading.tsx sends the shell first), so a real 404 is unreachable without breaking UX. Do not restore the hardcoded <meta name="robots" content="index, follow"> that used to sit in src/app/layout.tsx — it made every sold card explicitly indexable and produced ~1130 "duplicate, no user-selected canonical" pages in GSC.
Card metadata (src/app/[lang]/catalog/[id]/page.tsx) — three coupled invariants:
  1. title and H1 must stay in sync. Google uses H1 as its main source when rewriting SERP titles; an English-only H1 under a localized title invites a rewrite. Both carry model + trim + year + localized "from Korea", in the same word order.
  2. Snippet price must equal the price the visitor actually sees (ru → ₽, others → $). Order is model → year → geo → price; ka is the exception and puts price before geo, because Georgian glyphs are wide (Google truncates by pixel width) and the geo word is absent from the target query.
  3. JSON-LD Offer keeps priceCurrency KRW — it must match the headline price in CarDetailSidebar, not the reference conversion.
Use formatYear() ("2024") in titles/H1/descriptions. formatDate() returns Encar's "YY.MM" registration format — spec rows only; it reads as noise to buyers outside Korea.
The "| K-Axis" suffix from the global title template is suppressed on car cards via title: { absolute }, to save ~9 characters of the ~60-char budget.
Listing page (/[lang]/catalog) degrades instead of failing. getCars returns { data, count, failed } and never rejects; CarsRow renders three distinct states — cars, "nothing found" (empty result), and "temporarily unavailable" (failed: true) — all four locales. A 404 from Encar means a malformed query (e.g. junk in ?action=), not an outage: it maps to the empty state without spending a second round-trip on the proxy. src/app/[lang]/catalog/error.tsx is a segment-level boundary so an unexpected throw keeps the layout instead of falling through to the root app/error.tsx.
page.tsx and CarsRow must call getCars with IDENTICAL arguments — same query, same pageSize, same offset ((page-1)*pageSize). The ItemList JSON-LD has to describe the list the visitor actually sees, and matching arguments let Next dedupe the two calls into one Encar request. Passing sp.page straight through as offset (an old bug) broke both at once.

Car card — deliberate render-speed tradeoffs, do NOT "fix" them as bugs

Two blocks on /[lang]/catalog/[id] are intentionally kept out of the initial paint. Both were measured and chosen; treat a proposal to server-render them as a product decision, not a defect report.

- Option names (OptionsRow) live in collapsed Radix accordions and are NOT in the server HTML — only the per-category counts are ("Стандартные опции 37, Комфорт 11…"). Encar sends codes ("001","004",…) resolved against the 218-entry dictionary in OptionsRow/data.ts. Collapsing + lazy mount is what keeps the card's first paint cheap. Known SEO cost: ~37 real feature names per car never reach the HTML.
- RecommendedCars loads on scroll (IntersectionObserver → /api/recommended). Bots therefore see the <h2> with an empty carousel and get zero internal links from the card. Accepted for the same reason.

Contrast with DetailInfo (specs + accident/owner history): that one WAS moved to the server (src/lib/vehicleRecord.ts + DetailInfoSection.tsx behind Suspense) because it is the card's most unique content. Suspense keeps the first paint fast while the block still lands in the same HTTP response — that is the pattern to copy if any of the above is ever server-rendered.

Car card — upstream failures must not deindex live pages

fetchVehicleData distinguishes "sold" (Encar 404 → null) from "upstream down" (throws VehicleUpstreamError). generateMetadata sets robots noindex ONLY for the sold case. Never collapse the two into catch(() => null): during an Encar outage that served every live card as HTTP 200 + noindex, i.e. we asked Google to drop them. The 5xx the old comment promised is unreachable anyway — loading.tsx starts streaming, so the status is already sent.

Car card — metadata built from Encar's raw fields

- Korean spec words (carShape "세단 4도어", transmissionName "오토", fuelName "LPG(일반인 구입)") must go through src/lib/carLabels.ts. generateMetadata has no i18next instance (i18n is per-request), so it reads cars.json directly. Rule: if a word stays Hangul after lookup, the whole field is dropped — an empty field beats Korean in a Google snippet.
- manufacturerEnglishName arrives glued: ChevroletGMDaewoo, Renault-KoreaSamsung, KG_Mobility_Ssangyong. Always display via normalizeBrand(). It feeds H1, title, description and JSON-LD brand.
- H1 carries the title's prefix word for word (model + trim + year + localized "from Korea") and then a muted sub-line "mileage · transmission". Extending the tail is fine; changing the shared prefix breaks the title/H1 sync invariant above.
- Snippet budget is measured in PIXELS, not characters (Arial 20px, ~600px desktop). Current ru/en titles overrun by 26–37px and the truncation eats the price mid-number ("цена 638 0"). shortCarName still cuts at 34 chars — a character cut against a pixel budget. ka is correct by design: price sits before the geo tail, so the tail is what gets clipped.

Car card — image sizing

Gallery and lightbox are separate paths on purpose: the lightbox (yet-another-react-lightbox, dynamic ssr:false, own LIGHTBOX_WIDTHS up to 1920) loads nothing until the user opens it. Verified. Mobile (375px/DPR2 → cw=750 for a 343px box) and thumbnails (cw=256 for 90px) are accurate. Desktop is not: sizes says 60vw but the grid column (340px_1fr_300px) renders 552px ≈ 43vw, so DPR2 pulls cw=1920 (211 KB) where cw=1200 (100 KB) would do — ~317 KB wasted per card, desktop only.

Parts catalog
Entry: /[lang]/parts and /[lang]/parts/[slug]. UI blocks in src/app/parts/sections/ (not under [lang]/): PartsCatalog.tsx (server, SSR first page for SEO) → PartsCatalogClient.tsx (client, URL-driven filters) and ProductDetailClient.tsx. Details: docs/parts-pages-design-reference.md.
Data: /api/parts/products (paginated, faceted counts) ← parts_products.
Vehicle compatibility is split across two systems (see Rules): source of truth part_vehicles+vehicles (product page, /fitment, sitemaps, seo-generate); legacy parts_fitment+parts_vehicle_models (only catalog model-filter chips).
Parts-page design tokens are --pn-* custom properties in src/app/globals.css, distinct from axis.* Tailwind tokens used by the rest of the dark-themed site.

Пустая выдача каталога = точка потери клиента, а не служебное состояние

Нулевой результат поиска раньше означал «Ничего не найдено» — клиент делал вывод, что детали нет, и уходил. Теперь при products.length === 0 рендерится NoResultsBanner.tsx (src/app/parts/sections/): оффер «привезём под заказ» + три пути в личку — заявка через тот же OrderModal (source: parts_no_results, артикул из поиска подставляется в partNumber, лид уходит в Telegram через /api/telegram) и прямые ссылки WhatsApp / Telegram с готовым текстом запроса.
Инвариант: строка счётчика над сеткой при total === 0 остаётся ПУСТОЙ — «ничего не найдено» больше нигде не дублируется. Не возвращать t("parts.catalog.noResults") в results bar.
Ключи баннера — parts.catalog.miss.* во всех четырёх локалях (ru/en/ka/ar). Ключи noResults / noResultsHint остались в JSON для других мест — их наличие не значит, что баннер их использует.
События: search_no_results (с search_term), no_results_request, no_results_messenger — это метрика спроса на то, чего нет в базе; ей меряется, что закупать. Не переименовывать без причины.

Кеширование страниц запчастей — revalidate и generateStaticParams это РАЗНЫЕ ручки

Их однажды перепутали, и это стоило вечно замороженного курса валют. Отсутствие generateStaticParams — вот что не даёт сборке генерить 50k × 4 языка страниц; маршрут при этом рендерится по требованию при первом визите. revalidate к объёму сборки отношения не имеет: он задаёт, сколько отрендеренная страница живёт в кеше. revalidate = false означает не «не пререндерить», а «отрендерить один раз и не обновлять никогда» — до деплоя либо до явного revalidatePath/revalidateTag.

Текущие значения: /[lang]/parts 3600, /[lang]/parts/[slug] 86400, /[lang]/parts/category/[slug] 3600, /[lang]/fitment/[brand]/[slug] 86400.

Инвариант: на любом маршруте, который рендерит ЦЕНУ, revalidate не выше 86400. Цена в HTML считается от krwToUsd (getCurrencyRates, кеш 24ч), то есть курс запекается в разметку в момент рендера. Если страница не перерендеривается, кеш курса физически не может сработать — он опрашивается только при рендере. А /api/parts/checkout это POST, POST-роуты не кешируются никогда и считают по свежему курсу. Итог расхождения: витрина показывает одну цену, чекаут выставляет другую. Ровно тот же класс ошибки, что и stale-константа в generateMetadata на машинах.

Отсюда общее следствие: TTL внутренних unstable_cache (parts-catalog-data 3600, parts-product 3600, parts-top-links 86400 и прочие) подчинены revalidate маршрута. Если сегмент не перерендеривается, эти TTL декоративны — их некому опросить. Настраивать внутренний кеш, не посмотрев на revalidate сегмента, бессмысленно.

Диагностика кеша здесь — два ложных следа, оба уже сожгли время

- Пометка ƒ (Dynamic) в выводе next build значит ТОЛЬКО «не пререндерено на сборке» (у [lang] нет generateStaticParams). Она ничего не говорит о рантайме: такой маршрут всё равно кешируется после первого рендера и подчиняется revalidate.
- Cache-Control: private, no-cache, no-store прилетает на ВСЕ /[lang]/* HTML, включая заведомо пререндеренные SSG-страницы. Источник — middleware: он обновляет сессию Supabase и пишет куки в ответ, из-за чего Next помечает ответ приватным. Это про кеш браузера и CDN, а не про внутренний кеш маршрутов Next. Заголовка x-nextjs-cache на этих страницах не будет; он виден только там, куда middleware не лезет (например /sitemap-parts.xml).

Надёжная проверка одна — тайминги на прод-сборке (npm run build && npm run start): запросить ранее не рендеренный slug и повторить. Кешируется — холодный рендер секунды, повторы десятки миллисекунд (замер: 3.13s → 15ms). Не кешируется — все запросы одинаково медленные.

SEO automation pipeline (parts)

Cron-triggered, guarded by header x-seo-secret / env SEO_CRON_SECRET. Design doc: docs/seo-automation.md.

Collect /api/seo/collect (src/lib/gsc.ts) — GSC stats → seo_page_stats (45-day window)
Generate /api/seo/generate (src/lib/seo-generate.ts) — drafts RU+EN content → seo_suggestions (status: draft)
Telegram gate (src/lib/seo-telegram.ts) — manual approval required
Publish /api/seo/publish (src/lib/seo-publish.ts) — approved → parts_products (matched by part_number), revalidate, IndexNow ping (src/lib/indexnow.ts)

LLM access is provider-agnostic via src/lib/llm.ts (LlmClient.generateJSON()); provider/tier switch is env var LLM_PROVIDER only, no call-site changes. Transient failures retry; QuotaError stops the batch. blog-generate shares the same daily quota.

Other notable pieces
src/utils/customsCalculator/ — import duty calculator (Russia/Uzbekistan; engine cc, age, price).
src/lib/matryoshka.ts + src/lib/ems-rates.ts — bin-packing of EMS parcels into Korea Post boxes to minimize billed weight.
src/lib/supabase/client.ts vs server.ts — browser vs server clients (@supabase/ssr).
Admin panel (src/app/admin/) — separate auth from storefront: single ADMIN_PASSWORD env + admin_session cookie, checked in middleware.ts.
Deploys: Vercel (primary — vercel.json, cron, headers), Netlify mirror (netlify.toml), standalone Docker (output: 'standalone').
design-reference/ — separate Vite project, visual reference only; no runtime relationship to src/.
Docs by request (load only when relevant)
docs/seo-automation.md — full SEO pipeline design
docs/parts-pages-design-reference.md — parts UI breakdown
README.md — features, env var reference
Google Search Console — analytics access & gotchas

- GSC API is reachable from scripts via the service account: env GSC_SA_JSON (service-account key JSON, one line) + GSC_SITE_URL=https://www.kmotors.shop/. Helper: src/lib/gsc.ts (JWT → REST searchAnalytics/query). google-auth-library is installed. A manual export lives in ./https___www.kmotors.shop_-Performance-on-Search-2026-07-12/ but is a snapshot — pull fresh via the API for current numbers.
- Korea (country = "kor") clicks/impressions are the OWNER's own traffic, NOT real users. ALWAYS exclude Korea from any SEO analysis (dimensionFilterGroups country notEquals "kor"). Korea was ~43% of clicks in the 3-month window, so unfiltered totals — and especially the calculator's apparent rank/impressions — are heavily distorted by it.
- The car catalog is intentionally CLOSED for Korea (security + SEO): /ko/* is 301-redirected to /en/* (middleware.ts) so the SEO weight of legacy Korean-indexed URLs consolidates onto /en. This is deliberate — do not flag the ko→en redirect, the missing ko in hreflang, or leftover /ko/ clicks in GSC as bugs.

Korea is closed in TWO independent layers — a change to one does not affect the other

- Layer 1, Cloudflare WAF (outside this repo, nothing here can read or change it): a custom rule blocks requests from Korea at the edge. The exception is a higher-priority Skip rule keyed on a cookie — expression `http.cookie contains "my_secret_key=<value>"`. The VALUE IS DELIBERATELY NOT IN THIS FILE: the GitHub repo is PUBLIC, so anything committed here is world-readable forever. Keep it in .env / a password manager. To use it, set the cookie once in the browser for kmotors.shop; no app code reads it.
- Layer 2, in-app link hiding: CATALOG_BLOCKED_COUNTRIES = ["KR"] in src/hooks/useCountry.ts. middleware.ts copies cf-ipcountry into the browser-readable cookie x-user-country (24h), useCountry() reads it client-side, and six components drop their catalog entry points (Header, Footer, Home/Main, Home/NavCards, Home/PopularModels, blog post CTA). Cars only — parts stay visible.
- Layer 2 is cosmetic, NOT a security control: it only hides links. /[lang]/catalog answers 200 to anyone who reaches the origin, and the cookie is trivially editable in devtools. Do not treat it as access control, and do not "fix" the redundancy between the layers.
- Consequence for exceptions: the Cloudflare Skip cookie gets you past the edge but leaves the nav links hidden, because layer 2 keys off x-user-country and knows nothing about the bypass. Whitelisting anyone for real means touching both places.