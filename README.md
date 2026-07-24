# KMotors / K-Axis

> Full-stack e-commerce platform on `kmotors.shop`. Two catalogs under one roof: used Korean cars (Encar-sourced) and genuine Hyundai/Kia/Genesis OEM parts. Displayed brand is **K-Axis** (soft rebrand in progress — domain unchanged). Includes an in-house AI SEO pipeline, PayPal checkout, and a Telegram-driven ops workflow.

**Live site:** [kmotors.shop](https://kmotors.shop)

---

## Screenshots

![Screen 1](public/screenshots/screen1.png)
![Screen 2](public/screenshots/screen2.png)
![Screen 3](public/screenshots/screen3.png)
![Screen 4](public/screenshots/screen4.png)

---

## Features

- **Car catalog** — Encar-sourced used car listings with filters (brand, price, year, mileage), photo gallery, full spec sheet, VIN lookup, Korean license plate validation
- **Parts catalog** — genuine Hyundai/Kia/Genesis/SsangYong/Audi OEM parts (`/parts`), brand/category/subcategory facets, fitment lookup by vehicle model/generation (`/fitment/[brand]/[slug]`), cart + PayPal checkout
- **Customs calculator** — duty estimation for Russia and Uzbekistan based on engine volume, age, and price
- **Shipping cost optimizer** — bin-packing algorithm (`matryoshka.ts`) that groups EMS parcels into official Korea Post boxes to minimize billed weight, guaranteed never more expensive than per-item billing
- **AI SEO pipeline** (parts) — Search Console stats collector → LLM-drafted titles/descriptions/cross-refs → Telegram approval gate → publish + IndexNow ping (see below)
- **AI-generated blog** — Gemini-drafted posts + RSS auto-sync, both on Vercel cron
- **Multilingual** — Russian (default), English, Georgian, Arabic — `react-i18next`, geo/cookie/Accept-Language-based redirect in middleware. Korean is disabled (301 → `/en/*`)
- **Telegram integration** — order/checkout notifications, SEO digest + approval, webhook-driven admin actions
- **Admin panel** — password-protected route (`/admin`) for blog/content management
- **Analytics** — first-party click tracking (`/api/track`, bot/self-referral/admin filtered in middleware), GA4, Yandex Metrika, Search Console
- **SEO plumbing** — per-section sitemaps (main, catalog, parts, fitment, blog), `robots.ts`, IndexNow, security headers

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| UI | React 19, TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui + Radix UI |
| Database | Supabase (PostgreSQL), `@supabase/ssr` |
| Auth | Supabase Auth (storefront) + password-gate cookie (admin) |
| i18n | react-i18next (ru/en/ka/ar) |
| LLM | Gemini or Groq (Llama 3.3 70B) — provider-agnostic, one env var swap (`src/lib/llm.ts`) |
| Payments | PayPal |
| Email | Resend |
| Deployment | Vercel (cron jobs, security headers, edge middleware) |
| External APIs | Encar.com (cars), Search Console, Telegram Bot API |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project ([supabase.com](https://supabase.com))

### Installation

```bash
git clone https://github.com/Nikolanikol/KMotors.git
cd KMotors
npm install
```

### Environment Variables

Create `.env.local` in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Site
NEXT_PUBLIC_SITE_URL=https://www.kmotors.shop
NEXT_PUBLIC_NUMBER_PHONE=
NEXT_PUBLIC_EMAIL=

# Admin
ADMIN_PASSWORD=

# Telegram (order/checkout notifications, SEO gate, admin webhook)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_WORK_CHAT_ID=
TELEGRAM_WEBHOOK_SECRET=

# LLM (SEO generator + blog-generate) — pick one provider
LLM_PROVIDER=gemini            # or "groq"
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash  # optional
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile  # optional

# SEO automation
SEO_CRON_SECRET=          # guards /api/seo/collect, /generate, /publish
SEO_THROTTLE_MS=4500      # optional, throttle between LLM calls
GSC_SA_JSON=              # Search Console service-account key (JSON)
GSC_SITE_URL=

# Analytics
YANDEX_METRIKA_TOKEN=
# GA4 vars — see src/lib/analytics/ga4.ts

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_API_BASE=

# Email (Resend)
RESEND_API_KEY=
EMAIL_FROM=

# Blog
PEXELS_API_KEY=           # stock images for AI-generated posts
CRON_SECRET=              # guards /api/rss-sync
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm run create-admin` (seed an admin user, `scripts/create-admin.ts`).

---

## Project Structure

```
src/
├── app/
│   ├── [lang]/            # ru/en/ka/ar routes: catalog, parts, fitment, blog,
│   │                      # account, checkout, cart, compare, favorites, auth...
│   ├── admin/             # password-protected admin panel
│   ├── api/                # REST endpoints — parts, blog, blog-generate, rss-sync,
│   │                        # seo/{collect,generate,publish}, paypal, telegram(-webhook),
│   │                        # exchange-rate, indexnow, track, admin(-auth)
│   ├── sitemap*.xml, sitemap-*/[page]/, robots.ts
│   └── parts/sections/     # parts catalog UI building blocks
├── components/             # UI components by feature
├── lib/                    # supabase clients, i18n, seo (generate/publish/telegram),
│                            # llm.ts (Gemini/Groq), gsc.ts, matryoshka.ts, analytics/*
├── utils/                  # customs calculator, currency rates, slugs, plate validation
├── locales/                # i18n translations (ru, en, ka, ar)
└── middleware.ts            # lang routing/redirects, legacy-URL 301/308s, admin guard,
                              # bot filtering, first-party analytics dispatch
```

---

## SEO Automation Pipeline (parts catalog)

An unattended, human-gated content pipeline for parts pages, cron-triggered on Vercel and guarded by `SEO_CRON_SECRET`:

1. **Collect** (`/api/seo/collect`) — pulls Search Console impressions/CTR/position into `seo_page_stats`
2. **Generate** (`/api/seo/generate`) — picks parts with impressions but no improved copy yet, drafts `title`/`description`/body (RU+EN) and cross-reference numbers via the configured LLM, strict prompt rules (no invented specs, proper Russian automotive terminology, no transliteration), stores as `seo_suggestions` (`status: draft`)
3. **Telegram gate** — a digest of new drafts is sent for manual review; nothing reaches the storefront without approval
4. **Publish** (`/api/seo/publish`) — approved suggestions are written onto the live product row (matched by `part_number`) and pinged to **IndexNow**

## Customs Calculator

Calculates import duties based on vehicle age, engine displacement (cc), and price. Supports export markets: **Russia**, **Uzbekistan**.

---

## Deployment

Deployed on Vercel. Cron jobs:

```json
{
  "crons": [
    { "path": "/api/rss-sync", "schedule": "0 9 * * *" },
    { "path": "/api/blog-generate", "schedule": "0 10 */3 * *" }
  ]
}
```

SEO pipeline crons (`/api/seo/collect|generate|publish`) are triggered externally (not yet in `vercel.json`) with the `x-seo-secret` header.

---

## License

Private commercial project. All rights reserved.
