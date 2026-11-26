# План зачистки — потоки и владение файлами

Составлен 26.11.2026 оркестратором. Журнал выполненного — `docs/cleanup-log.md`.
Основа — отчёты аудита (связность ядер, мёртвый код, контекст, lint/tsc).

## Правила, общие для всех потоков

1. Каждый поток — своя ветка и свой git-worktree от `integration/cleanup`. Коммиты
   только локальные. НИКАКОГО `git push`, `gh pr`, слияний и переключения веток.
2. **Владение файлами.** Поток правит ТОЛЬКО файлы из своей строки таблицы. Нужна правка
   вне списка — остановиться и написать в отчёте, не править. Это и гарантирует отсутствие
   конфликтов при слиянии.
3. `CLAUDE.md`, `docs/cleanup-log.md`, `docs/cleanup-plan.md` и README правит ТОЛЬКО
   оркестратор при слиянии. Поток пишет в отчёте, что именно нужно записать.
4. Проверка перед сдачей: `npm run lint` по изменённым файлам и `npx tsc --noEmit`.
   База tsc на старте — ровно 5 ошибок в исходниках (`FavoritesClient.tsx`,
   `ProductDetailClient.tsx` ×2, `CarDetail/Header.tsx`, `scripts/translate-parts-dict.ts`)
   плюс ~34 в `design-reference/`. Новых ошибок быть не должно.
5. `node_modules` берутся из корня основного репозитория (родительский каталог
   worktree). `npm install` / `npm ci` в потоках НЕ запускать; `package.json` и
   `package-lock.json` не трогать.
6. Не запускать `scripts/`, `sql/`, ничего, что ходит в боевую Supabase.
7. Отчёт потока: до 200 слов — что сделано (коммиты), результат lint/tsc, что вне списка
   потребовалось, что записать в журнал/правила.

## Волна 1 — параллельно, файлы не пересекаются

| Поток | Ветка | Модель | Владеет (только эти файлы) |
|---|---|---|---|
| S1 чистая база | `step/05-clean-base` | Sonnet | конфиг ESLint (`eslint.config.*`), `tsconfig.json`, `src/app/parts/sections/ProductDetailClient.tsx`, `src/app/(site)/[lang]/favorites/FavoritesClient.tsx` (в т.ч. замена локального `WA_PHONE` на импорт из `src/lib/contact.ts`), `scripts/translate-parts-dict.ts` |
| S2 ядро курсов | `step/06-fx-core` | Opus | новая папка `src/lib/fx/**`, `src/utils/getCurrencyRates.ts`, `src/lib/kbFx.ts`, `src/lib/customs/fx/**`, `tests/fx/**` |
| S3 мёртвые файлы | `step/07-dead-files` | Sonnet | удаление: 18 файлов без импортёров из аудита (список в брифе), `src/locales/ko/*.json`, мусор в `public/` (4 svg create-next-app) |
| S4 мелочи | `step/08-small-fixes` | Haiku | `src/app/parts/sections/NoResultsBanner.tsx`, `src/components/MessengerButtons.tsx`, `src/components/Catalog/Row/CarCard.tsx`, `src/components/Catalog/CarDetail/SoldCar/SoldCarCta.tsx`, `src/components/Catalog/CarDetail/StickyMobileCTA.tsx`, `src/app/not-found.tsx`, комментарий в `src/app/(site)/[lang]/calculator/[country]/page.tsx` |
| S5 заголовки безопасности | `step/09-sec-headers` | Sonnet | только `next.config.ts` |

Пересечения проверены: `CarDetail/Header.tsx` (ошибка tsc) мёртвый файл — его удаляет S3,
S1 его не трогает; `FavoritesClient.tsx` входит и в tsc-ошибки, и в `WA_PHONE` — целиком у S1;
мёртвый экспорт `toKrw` в `getCurrencyRates.ts` остаётся S2.

Порядок слияния в `integration/cleanup`: S1 → S3 → S4 → S5 → S2 (каждое `--no-ff`,
тег `cleanup/NN-…`, запись в журнал). После каждого слияния — lint и tsc на integration.

## Волна 2 — после слияния волны 1 (последовательно, зависимости)

| Шаг | Что | Зависит от | Файлы (конфликт с волной 1 снят слиянием) |
|---|---|---|---|
| 10 перевод потребителей курса | все `getCurrencyRates`/`getCarRates`/`getRates` → новый вход `src/lib/fx`, удаление обёрток | S2 | layout, страницы, API, компоненты |
| 11 виджет растаможки | переключить на `src/lib/customs` или убрать; потом удалить `/api/exchange-rate`, `utils/customsCalculator`, `data/calcTranslations.ts` | решение владельца | `CarDetail/CustomsCalculator/*`, `CarDetailSidebar`, `api/exchange-rate`, `blog-generate` (курс) |
| 12 развязка middleware и шапки | манифесты путей, корзина/избранное из шапки | шаг 10 (общий `layout.tsx`) | `middleware.ts`, `Header`, `[lang]/layout.tsx` |
| 13 зависимости | удалить 33 пакета, пересобрать лок npm 11 | решение по `package-lock.json` | `package.json`, `package-lock.json` |
| 14 остаток lint | 114 `no-require-imports`, 53 неиспользуемых, 24 `any` | всё выше | много файлов |

## Решения владельца, без которых шаги стоят

- Виджет растаможки в карточке авто: переключить на `lib/customs` (рекомендую) или убрать.
- ⚠️ `package-lock.json` в рабочем каталоге владельца изменён и НЕ закоммичен (−512 строк,
  вырезаны опциональные записи `vitest/…/@esbuild/*`) — это тот самый класс поломки,
  из-за которого `npm ci` в Docker падает с EUSAGE (npm 10 против 11). Не коммитить, пока
  не проверено; шаг 13 стоит за этим.
- Стек dokanmazad (~5 400 строк, живёт только в `/admin/auction`), `data/*.db`
  в git, `scripts/` и `sql/` разового назначения, `vercel.json`/`netlify.toml`,
  `settings.local.json` (разрешения `node -e`, `python3 -c`), чистка памяти Claude.
