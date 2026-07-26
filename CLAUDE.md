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

Parts catalog
Entry: /[lang]/parts and /[lang]/parts/[slug]. UI blocks in src/app/parts/sections/ (not under [lang]/): PartsCatalog.tsx (server, SSR first page for SEO) → PartsCatalogClient.tsx (client, URL-driven filters) and ProductDetailClient.tsx. Details: docs/parts-pages-design-reference.md.
Data: /api/parts/products (paginated, faceted counts) ← parts_products.
Vehicle compatibility is split across two systems (see Rules): source of truth part_vehicles+vehicles (product page, /fitment, sitemaps, seo-generate); legacy parts_fitment+parts_vehicle_models (only catalog model-filter chips).
Parts-page design tokens are --pn-* custom properties in src/app/globals.css, distinct from axis.* Tailwind tokens used by the rest of the dark-themed site.
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