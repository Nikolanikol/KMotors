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

## Волна 2а — запущена 26.11.2026 после слияния волны 1 (решение владельца: виджет → на ядро)

| Поток | Ветка | Модель | Владеет (только эти файлы) |
|---|---|---|---|
| S6 виджет растаможки на ядро | `step/11-widget-core` | Opus | `src/components/Catalog/CarDetail/CustomsCalculator/**`, `src/components/Catalog/CarDetail/CarDetailSidebar.tsx`, `src/app/(site)/[lang]/catalog/[id]/page.tsx` (весь файл, в т.ч. его импорты курса), `src/app/api/exchange-rate/route.ts` (удалить), `src/utils/customsCalculator/**` (удалить), `src/data/calcTranslations.ts` (удалить), `src/app/api/blog-generate/route.ts` (только курс), `src/locales/{ru,en,ka,ar}/customs.json` (если нужны ключи), `src/lib/customs/**` кроме `fx/` |
| S7 потребители курса | `step/10-fx-consumers` | Sonnet | импорты курса во всех остальных файлах: `getCurrencyRates` / `kbFx` / `customs/fx` → `@/lib/fx`; обёртки НЕ удалять |

Обёртки (`utils/getCurrencyRates.ts`, `lib/kbFx.ts`, `lib/customs/fx/*`) удаляются отдельным шагом ПОСЛЕ слияния обоих потоков.

## Дальнейший план (составлен 26.11.2026, после слияния S7; S6 в работе)

Порядок по риску и ценности. Каждый шаг — ветка от `integration/cleanup`, слияние `--no-ff`,
тег, запись в журнал, lint + tsc + vitest после слияния. Прод не трогаем до отдельного
решения о выкладке.

### Сразу после S6
| Шаг | Что | Кто |
|---|---|---|
| 11 слить S6 | виджет на ядро, удаление `/api/exchange-rate`, старой копии формул и `calcTranslations` | оркестратор, после проверки диффа и отчёта живой проверки |
| 11b удалить обёртки курса | `utils/getCurrencyRates.ts`, `lib/kbFx.ts`, `lib/customs/fx/*` (обёртки); поправить упоминания путей в `catalog/CLAUDE.md`, `customs/CLAUDE.md`; запись в `CLAUDE.md` | оркестратор |

### Волна 3 — развязка прода (высокий риск, параллельно, файлы не пересекаются)
| Поток | Что | Файлы | Модель |
|---|---|---|---|
| S8 middleware | вынести списки путей ядер (`KR_BLOCKED_*`, `isExcluded`, 410, редиректы запчастей) в манифесты; убрать `supabase.auth.getUser()` без таймаута с пути каждой страницы (или добавить таймаут и деградацию); регрессионные тесты на матрицу «путь × страна × бот» | `src/middleware.ts`, новые `src/lib/routes/**` | Opus |
| S9 шапка и layout | корзина и избранное из статических импортов шапки → ленивая загрузка; курс корзины не через `[lang]/layout` | `Header/**`, `Cart/**`, `Favorites/**`, `[lang]/layout.tsx` | Sonnet |
| S10 главная | запрос к прокси Encar в `CarSlider` без таймаута и Suspense: добавить `AbortSignal.timeout`, Suspense, деградацию | `Home/CarSlider/**`, `[lang]/page.tsx` | Sonnet |

### Волна 4 — дубли и мёртвое (механика, потоки по разным каталогам)
| Что | Объём |
|---|---|
| единые `LANGS` (13 копий), URL сайта (62 файла), Telegram-клиент (13 копий), пересчёт 만원→вон через `encarToKrw` (5 мест) | много файлов; делать по одной теме на поток, последовательно, чтобы не конфликтовать |
| мёртвые `src/lib/poster/parts.ts`, `src/lib/email.ts` и пакет `resend` (после решения владельца) | 2 файла + пакет |
| остаток lint: 40 ошибок, 60 предупреждений; 45 неиспользуемых импортов (`tsc --noUnusedLocals`), 26 неиспользуемых иконок в `OptionsRow.tsx` | по каталогам |
| 33 неиспользуемых пакета и пересборка `package-lock.json` npm 11 | стоит за решением по `package-lock.json` |

### Перед выкладкой на прод (отдельное решение владельца)
1. Сравнение «main против integration» на ключевых страницах (`/ru`, `/ru/catalog`, `/ru/parts`, `/ru/parts/<артикул>`, `/ru/calculator`, `/ru/auction`, `/ru/blog`): цены, статусы, заголовки.
2. `npm ci` под npm 10 и 11 (правило про Docker в `CLAUDE.md`).
3. PR из `integration/cleanup` в `main`, push только по явному «да».
4. После выкладки: `curl -sI` на заголовки безопасности, URL, которого не было в прежней сборке (правило про молчаливый провал деплоя), логи `[fx:` в Coolify.
5. Вручную на VPS: снять строку `/api/poster/parts/run` из crontab.

### Решения владельца, которые ждут
- обновить фолбэк-снимки курса живым ответом (рынок и таможня, даты август 2026);
- `package-lock.json` в рабочей папке: изменён и не закоммичен (−512 строк);
- стек dokanmazad (~5 400 строк, только `/admin/auction`), `vercel.json`/`netlify.toml` (заголовки теперь в `next.config.ts`), `data/*.db` в git, разовые `scripts/` и `sql/`;
- `settings.local.json` (разрешения `node -e`, `python3 -c`), чистка памяти Claude;
- удалить ли мёртвые `poster/parts.ts` и `email.ts` вместе с пакетом `resend`.
