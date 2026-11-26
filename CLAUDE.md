# CLAUDE.md

Инструкции для Claude Code в этом репозитории.

Разборы инцидентов вынесены в [docs/postmortems.md](docs/postmortems.md), отложенные
вопросы — в [docs/open-questions.md](docs/open-questions.md). Здесь только то, что нужно
знать до того, как трогать код.

## Как говорить с владельцем (правило владельца, 27.11.2026)

Смотреть на решения владельца критически. Если решение откровенно плохое, противоречит
данным или мешает цели, а также если известно, как сделать лучше, — сказать об этом прямо
и сразу, до выполнения, с цифрами и коротким доводом. Не поддакивать и не молчать ради
вежливости. Решение после этого остаётся за владельцем: возразил один раз по делу, дальше
выполняй выбранное. То же про проблемы в самой работе: дефект, слабое место, риск или
отложенная проверка — в отчёт сразу, не прятать в конец.

## Что это

Full-stack e-commerce на kmotors.shop (бренд в интерфейсе — K-Axis, мягкий ребрендинг,
домен прежний; логотип и палитра — Axis, бронза). Три каталога: подержанные корейские
авто (источник Encar), лоты автоаукционов (с 04.10.2026 через carnect: K Car, Lotte, SK,
Autobell, Autohub и HeyDealer) и оригинальные запчасти Hyundai/Kia/Genesis. Свой AI
SEO-пайплайн, оплата через PayPal, операции через Telegram. Полный список фич и
переменных окружения — README.md.

### Ядра — где лежат правила

Вложенные `CLAUDE.md` Claude Code подгружает сам, когда работает с файлами их папки.
`docs/core-*.md` сами НЕ грузятся — открыть руками, если трогаешь их тему.

| Трогаешь | Открой |
|---|---|
| каталог Encar: листинг, фильтр, карточка, проданная машина, цена авто и курс KB, модельные страницы, замеры Encar API | [src/app/(site)/[lang]/catalog/CLAUDE.md](src/app/(site)/[lang]/catalog/CLAUDE.md) |
| `cars_seen`, подписки «пришлём похожие» | [docs/core-cars-data.md](docs/core-cars-data.md) |
| публичный аукцион `/auction` (carnect, HeyDealer), цены за входом, регистрация = лид | [src/lib/carnect/CLAUDE.md](src/lib/carnect/CLAUDE.md) |
| служебный `/admin/auction`, `auction_results`, прогноз молотка K Car | [src/app/(admin)/admin/auction/CLAUDE.md](src/app/(admin)/admin/auction/CLAUDE.md) |
| мёртвая витрина dokanmazad (архив, не грузится) | [docs/archive/auction-dokanmazad.md](docs/archive/auction-dokanmazad.md) |
| запчасти: цена, каталог, корзина, поиск, кеш/ISR | [src/app/parts/CLAUDE.md](src/app/parts/CLAUDE.md) |
| калькулятор растаможки | [src/lib/customs/CLAUDE.md](src/lib/customs/CLAUDE.md) |
| отслеживание EMS | [src/app/tracking/CLAUDE.md](src/app/tracking/CLAUDE.md) |
| UI-чеклист, бренд/бронза/логотип/иконки, шапка, избранное | [src/components/CLAUDE.md](src/components/CLAUDE.md) |
| расписания, крон-раннер, Coolify Scheduled Tasks, crontab | [scripts/cron/CLAUDE.md](scripts/cron/CLAUDE.md) |
| курсы валют: единая точка входа, три вида (рынок, авто по KB, таможня), фолбэк-снимки | [src/lib/fx/CLAUDE.md](src/lib/fx/CLAUDE.md) |
| SEO, og-карточки, llms.txt, сайтмапы, блог, SEO-пайплайн, GA4, GSC | [docs/core-seo.md](docs/core-seo.md) |
| i18n: разделы словаря по маршрутам, AuthProvider | [docs/core-i18n.md](docs/core-i18n.md) |
| служебный хост, Cloudflare Access, Coolify Direction | [docs/core-infra.md](docs/core-infra.md) |
| полный текст разделов этого файла (деплой, цены, Корея, роутинг…) | [docs/core-root-details.md](docs/core-root-details.md) |

## Команды

```bash
npm run dev          # next dev --turbopack
npm run dev:clean    # снести .next, затем dev
npm run build        # next build --turbopack
npm run lint         # eslint
```

`npm run create-admin` в package.json есть, но `scripts/create-admin.ts` НЕТ — команда сломана.

## Проверка — ОБЯЗАТЕЛЬНА перед тем, как считать задачу сделанной

Сборка ошибок НЕ ловит: в `next.config.ts` стоят `eslint.ignoreDuringBuilds: true` и
`typescript.ignoreBuildErrors: true`. Прошедшая сборка не доказывает ничего. Всегда:

```bash
npm run lint
npx tsc --noEmit
```

Тестов в проекте нет — не рассчитывать на `npm test`.

**Застрял — сообщи сразу.** lint + tsc обязательны всегда. Всё остальное (браузер,
дев-сервер, скриншоты, скрипты, внешние API): виснет или требует обходов — ОСТАНОВИСЬ
после ВТОРОЙ неудачной попытки и напиши, что не работает, что сделано, какие варианты.
Скрытая панель браузера даёт чёрные скриншоты — проверять через DOM/read_page. Сама
работа важнее её демонстрации.

**Сначала самый короткий путь.** Данные в базе — Supabase Dashboard → SQL Editor, один
`SELECT`, а не скрипт и не curl к PostgREST. Упёрлись в права — НЕ подбирать обходы
(`NODE_PATH`, другой рантайм, скрипт в обход `deny`): сказать пользователю, каким одним
действием он достанет это сам. Три ветвления подряд на задаче в один шаг — сигнал
остановиться и переспросить. Полный текст и живой случай — [docs/core-root-details.md](docs/core-root-details.md).

## Деплой и прод — ЧИТАТЬ ПЕРВЫМ

- Каждый push в `main` запускает автоматический редеплой прода (Coolify на VPS). `git push`
  в main — это действие «выкатить», а не «сохранить».
- Supabase развёрнут на том же VPS и является ЖИВОЙ ПРОДАКШЕН-БАЗОЙ. `.env` смотрит на неё.
  Любой SQL, скрипт с данными, команда supabase CLI бьёт прямо в прод. Staging-базы нет.
- Coolify — единственный живой прод. `vercel.json` Coolify НЕ читает (заголовки безопасности с 26.11.2026 заданы в `next.config.ts`; до этого на проде их не было вовсе), `netlify.toml`
  мёртв, `output: 'standalone'` для Docker. «Vercel primary» не восстанавливать.
- ⚠️ **Провал сборки НЕ роняет прод — и потому не виден.** Coolify оставляет прежний
  контейнер. После push проверять URL, которого в прежней сборке не было, а не главную.
- ⚠️ **`npm i -g npm@11` в Dockerfile — не украшение.** В `node:20-alpine` npm 10.8.2, а лок
  пишет npm 11; опциональные peer-зависимости расходятся, и `npm ci` падает с EUSAGE. Пин
  не снимать, базовый образ не менять, не сверив npm внутри. lint и tsc этого не ловят.

## Жёсткие правила

- НИКОГДА не делать `git push` — ни в main, ни в любую ветку — без явного подтверждения
  пользователя в текущей сессии. Закоммитить локально, затем остановиться и доложить.
  `git push` и `gh pr merge` стоят в `ask` в `.claude/settings.json` (решение владельца
  26.11.2026): каждый раз приходит запрос на подтверждение, владелец нажимает «да» — и
  только тогда выполняется. Хук `pre_tool.sh` закомментирован целиком; включать его
  в нынешнем виде нельзя — он блокировал бы push насовсем, а не спрашивал. Обход через `python3 -c` / `node -e` в
  `settings.local.json` правило не отменяет — не использовать.
- Вся работа в feature-ветках, не коммитить прямо в main.
- Навигация по коду — обычными `Grep`/`Glob`/`Read`. Serena (MCP) УДАЛЕНА 26.11.2026
  (решение владельца): за 51 сессию навигацией не пользовались ни разу, только правкой
  текста, а подключение тянулось с GitHub и падало по таймауту. Не подключать заново и не
  ссылаться на неё в правилах; если `mcp__serena__*` вдруг появился — игнорировать.
- Не запускать скрипты из `scripts/` или `sql/` без явного подтверждения — они бьют в прод.
  Сперва прочитать шапку скрипта (LIMIT, CONCURRENCY, DELAY_MS).
- Не менять схему БД, RLS и не выполнять разрушительный SQL без явного подтверждения.
- ⚠️ Дев-сервер с корневым `.env` бьёт в ПРОДОВУЮ Supabase, и рендер карточки авто ПИШЕТ в `cars_seen`: если Encar с этого IP вернул страницу блокировки (`has_been_cr_blocked`, код 404), живая машина помечается проданной (`sold_at`; снимается при следующем показе). Для проверок без записи — страница-стенд без запросов к Encar и только `NEXT_PUBLIC_*` в `.env.local`.
- `parts_staging` закрыта для кода приложения, приложение читает `parts_products` (вопрос
  открыт с 22.09.2026, см. open-questions; решение не принято).
- Не расширять `parts_fitment` / `parts_vehicle_models` (легаси); совместимость — в
  `part_vehicles` + `vehicles`.
- Любой `.range()`/`.limit()` по неуникальному ключу — вторым ключом `.order("id")`, иначе
  строки пропадают между страницами.

## Сквозные инварианты

Полный текст с историей — [docs/core-root-details.md](docs/core-root-details.md), если не указано иное.

**Цены и курсы**
- ⚠️ ЕДИНСТВЕННАЯ точка входа за курсом — `src/lib/fx` (`getFx("market"|"car"|"customs")`,
  правила — [src/lib/fx/CLAUDE.md](src/lib/fx/CLAUDE.md)); старые обёртки
  (`getCurrencyRates`, `kbFx`, `customs/fx`) удалены 26.11.2026, прямых походов за курсом
  не заводить. Курс запрашивает
  ТОЛЬКО сервер; клиент получает его пропсом, своих запросов не делает. Никогда не
  зашивать курс константой. `?? FALLBACK` на внешнем курсе обязан логироваться.
- Источники РАЗНЫЕ: рубль — ЦБ РФ (оттуда же `rubToUsd`), доллар — frankfurter (RUB не
  отдаёт). Не сводить к одному.
- Три модели цены, не смешивать: запчасти — KRW → USD только через `src/lib/pricing.ts`
  (множитель на странице — всегда ошибка; [src/app/parts/CLAUDE.md](src/app/parts/CLAUDE.md));
  авто — `src/lib/carPricing.ts`, Encar + стояночный сбор на ВСЕХ уровнях, курс Кукмин-банка
  (исключение одно — база калькулятора растаможки); модельные страницы — ручные вилки
  `src/data/model-pages.ts` ([catalog/CLAUDE.md](src/app/(site)/[lang]/catalog/CLAUDE.md)).
  Аукцион — своя, четвёртая: воны + «≈ $» по KB ([carnect](src/lib/carnect/CLAUDE.md)).
- На маршруте, который рендерит ЦЕНУ, `revalidate` не выше 86400.
- ⚠️ Сумму заказа сервер считает по СВОЕМУ курсу, поле курса из тела запроса игнорируется.
  Клиентский курс — только для показа.

**Данные и внешние вызовы**
- Никогда не читать `image_url` напрямую — только через `src/lib/partImage.ts`
  (`resolvePartImage` / `withCleanImage`; предпочитает `image_storage_url`).
- Обращения к Encar не бросают исключений НИКОГДА: хелпер с `AbortSignal.timeout`
  (8s / 20s прокси), `res.ok`, try/catch и вокруг фолбэка. Голого `fetch` к Encar в
  компоненте не добавлять. Фото — только `Photos?.[0]?.location`.
- ⚠️ «Продано / ушло» ≠ «апстрим лежит» — везде (Encar `null` против
  `VehicleUpstreamError`, витрины `gone` против `failed`, EMS `not_found` против
  `upstream_error`). Не схлопывать в `catch(() => null)`; сбой не кешировать.
- Гейты крон-роутов FAIL-CLOSED: `if (!secret || req.headers.get("x-poster-secret") !== secret) return 401`.
- SEO-пайплайн никогда не трогает живые данные до гейта одобрения в Telegram
  ([docs/core-seo.md](docs/core-seo.md)).

**Рендер, кеш, вес страницы**
- Canonical и hreflang — только `makeAlternates(lang, path)` (`src/lib/seo.ts`); главная
  передаёт `""`, не `"/"` (`trailingSlash` = false, `"/"` даёт 308).
- ⚠️ `cookies()` в корневом layout НЕЛЬЗЯ — он делает динамическим всё дерево. Корневых
  layout три (`(site)`, `(root)`, `(admin)`), общая оболочка — `src/app/RootShell.tsx`.
- ⚠️ Без `generateStaticParams` ISR маршрута ВЫКЛЮЧЕН, `revalidate` декоративен; лечится
  пустым массивом. Маршрут с `searchParams` не кешируется вовсе. Проверять кеш только
  `prerender-manifest.json` и `x-nextjs-cache` ([src/app/parts/CLAUDE.md](src/app/parts/CLAUDE.md)).
- ⚠️ Клиент Supabase и `AuthModal` не тянуть в общий путь (`[lang]/layout`, шапку): вход в
  шапке — по cookie (`hasSessionCookie`), окно — ленивое (`Header/AuthModalHost.tsx`)
  ([docs/core-i18n.md](docs/core-i18n.md), [src/components/CLAUDE.md](src/components/CLAUDE.md)).
- ⚠️ Раздел словаря из `ROUTE_SECTIONS` (`src/lib/loadLocale.ts`) подключать
  `<SectionDictionary/>` на КАЖДОЙ своей странице — иначе сырые ключи у клиента, и ни lint,
  ни tsc, ни сборка этого не видят. Проверять живым запросом ([docs/core-i18n.md](docs/core-i18n.md)).

**UI** — сдавать сразу с интерактивностью, стилем бренда и удобством
([src/components/CLAUDE.md](src/components/CLAUDE.md)):
1. Курсор: `pointer` / `not-allowed` / `wait`; кликабельный `<div>` — `role="button"`.
2. Hover у каждого интерактивного элемента; цвет, меняющийся на hover, — классом, не `style`.
3. Фокус: `focus-visible:ring-2`; `outline-none` без кольца не ставить.
4. Модалки и выпадашки — многослойная тень, фон `--axis-charcoal`, поля `--axis-graphite`.
5. Только токены бренда; бронза — по правилу двух токенов (`--axis-bronze` текст,
   `--axis-bronze-deep` заливка).
6. Переход на другую страницу даёт отклик (`NavigationStatus`, `navStart`); проверка —
   глазами в браузере, на десктопе и мобильной ширине.

**Роутинг, Корея, GSC**
- ⚠️ Локали — только `src/lib/lang.ts` (`LANGS`, `isLang`, `langOrDefault`), адрес сайта —
  только `SITE_URL` из `src/lib/site.ts`; локальных `LANGS` / `SUPPORTED_LANGS` / `BASE` /
  `SITE` с «https://www.kmotors.shop» не заводить (их было 25 и 60, убраны 26.11.2026).
  Цену объявления Encar приводить через `encarToKrw` (`src/lib/carPricing.ts`), не `* 10000`.
- Публичные страницы — `src/app/(site)/[lang]/…`, `[lang]` ∈ `ru | en | ka | ar`
  (`src/lib/lang.ts`); `ko` отключена (301 → `/en`, не баг). Админка —
  `src/app/(admin)/admin/…`, вход по `ADMIN_PASSWORD` + cookie.
- ⚠️ Корея закрыта в ТРИ независимых слоя: 403 в `src/middleware.ts` (решает `classifyRequest` из
  `src/lib/routes`; новый такой маршрут — в манифест ядра `src/lib/routes/<ядро>.ts`
  (`*_KR_BLOCKED_PAGES`/`*_KR_BLOCKED_API`), НЕ в `middleware.ts`; проверка — `tests/routes`), Cloudflare WAF (вне репозитория) и косметическое скрытие ссылок
  (`useCountry.ts`). 403 из Кореи — работающее правило, а не сломанный прод. Владелец ходит
  через служебный хост ([docs/core-infra.md](docs/core-infra.md)).
- ⚠️ В GSC Корея (`kor`) — трафик владельца: ВСЕГДА исключать из SEO-анализа.

## Документы по запросу (грузить только когда нужно)

- [docs/postmortems.md](docs/postmortems.md) — разборы инцидентов за правилами
- [docs/open-questions.md](docs/open-questions.md) — отложенные решения и замеры
- [docs/core-root-details.md](docs/core-root-details.md) — полный текст сжатых здесь разделов
- [docs/seo-automation.md](docs/seo-automation.md) — устройство SEO-пайплайна
- [docs/seo-indexing/](docs/seo-indexing/README.md) — ЖУРНАЛ индексации. ⚠️ Любой замер
  GSC, SEO-действие или выкатку записывать туда в тот же день (источник, окно, «с Кореей /
  без»); новые записи — в конец, старые не править
- [docs/parts-pages-design-reference.md](docs/parts-pages-design-reference.md) — интерфейс запчастей
- [docs/customs-buying-guide.md](docs/customs-buying-guide.md),
  [-kz](docs/customs-buying-guide-kz.md), [-uz](docs/customs-buying-guide-uz.md) — памятки
  для клиента по РФ, КЗ, УЗ; выводы между странами не переносить
- [docs/analytics-funnels.md](docs/analytics-funnels.md) — события GA4 по воронкам; новое
  событие — в таблицу документа
- [docs/carnect.md](docs/carnect.md) — источник carnect и витрина аукциона
- [README.md](README.md) — фичи, справочник переменных окружения
