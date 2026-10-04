# Воронки в GA4 — события сайта и настройка (05.10.2026)

Цель владельца: видеть по четырём разделам (машины Encar, аукционы, запчасти,
калькулятор), на каком шаге человек уходит, — и в первую очередь понять, почему
машины смотрят, а заявок на них нет.

GA4: `G-ZMRTQCD8SF` (подключён в `src/app/RootShell.tsx`). Все события идут через
`trackEvent` / `trackOnce` в `src/utils/gtag.ts`.

## Как устроено в коде

- **`section`** — у КАЖДОГО события, проставляется в `trackEvent` по адресу страницы:
  `encar` (/catalog, /models), `auction`, `parts` (/parts, /cart, /fitment, /tracking),
  `calculator`, `other`. На нём держится разделение воронок.
- **Очередь до загрузки GA.** События просмотра шлются при гидратации, раньше, чем
  грузится gtag; раньше они терялись (найдено на `calc_view`). Теперь ждут в очереди.
- **`trackOnce`** — шаг считается один раз за просмотр страницы (адрес + query).
- **Разметка блоков без клиентского кода** — `FunnelTracker`
  (`src/components/analytics/FunnelTracker.tsx`): `data-track-block="price"` → событие
  `view_block` при попадании блока в экран; `data-track-click="gallery_open"` → событие
  с этим именем при клике (`data-track-label` — уточнение).
- **Внутренний трафик.** На служебном хосте и localhost `gtag('set', {traffic_type:
  'internal'})` — в GA4 отсекается фильтром данных (шаг 3 ниже).

## События по воронкам

### Машины Encar (`section = encar`) — подробная

| шаг | событие | параметры |
|---|---|---|
| 1. увидел выдачу | `view_item_list` | `item_list_name=encar_catalog`, `result` ok/empty/unavailable, `count`, `page`, `filtered` |
| 2. кликнул машину | `select_item` | `car_id`, `car_name`, `car_price` |
| 3. открыл машину | `view_item` | `item_id`, `item_name`, `item_category=encar`, `value` |
| 4. смотрел | `view_block` | `block`: `gallery`, `price` (моб.), `sidebar`, `customs_calc`, `history`, `options`, `recommended` |
| | `gallery_open`, `gallery_depth` (`photo` 5/10/20) | |
| | `options_open`, `calc_interact` | |
| | `scroll_depth` | 25/50/75/90 |
| 5. сохранил / поделился | `add_to_wishlist`, `contact` (`method=share`…) | |
| 6. начал заявку | `form_start` | `source`, `car_id` |
| ✗ сорвалось | `form_invalid` (`missing` name/phone), `form_error` (`status`) | |
| 7. **заявка** | `generate_lead` | `source`: `car_detail`, `car_detail_mobile`… |
| 7'. **написал** | `contact` | `method`: whatsapp/telegram/…_sticky |

⚠️ `form_invalid` — главный подозреваемый в «нет заявок»: поле телефона принимает
неполный номер, и форма молча ничего не отправляла. Теперь это видно.

### Аукционы (`section = auction`)

`view_item_list` (`auction_catalog`) → `select_item` (`label` = площадка/лот) → `view_item`
(`item_category=auction`, `house`, `price_kind`) → `view_block` (`gallery`, `price`,
`specs`, `docs`, `body`, `inspection_sheet`, `defects`, `checks`, `history`, `legal`,
`options`, `similar`, `request_form`, `engine_sound`) → `sticky_cta`, `share`,
`add_to_wishlist` → `form_start` → `generate_lead` (`source=auction_lot`) или `contact`
(`label` whatsapp_lot / whatsapp_sticky).

### Запчасти (`section = parts`)

`search` / `search_no_results` → `view_item` → `add_to_cart` → `view_cart` (`via` page /
drawer) → `begin_checkout` → `generate_lead` (`source=parts_cart`). Ветка пустого поиска:
`search_no_results` → `no_results_request` / `no_results_messenger`.

### Калькулятор (`section = calculator`)

`calc_view` (`country`) → `calc_input` (первое изменение, `field`) → `calc_engaged`
(3+ изменения: человек считает СВОЮ машину) → `view_block` `calc_result` → `contact` /
`generate_lead` с этой же `section`.

## Настройка в GA4 — по шагам (делает владелец)

1. **Key events.** Admin → Events: отметить `generate_lead` и `contact` как Key event
   (бывшие «конверсии»). Без этого отчёты о конверсиях пустые.
2. **Свои параметры.** Admin → Custom definitions → Create custom dimension, область
   Event: `section`, `source`, `block`, `result`, `house`, `country`, `missing`, `label`,
   `item_list_name`, `method`. Незарегистрированный параметр в отчётах не виден.
   Данные появляются только с момента регистрации — сделать сразу после выкладки.
3. **Свой трафик.** Admin → Data streams → поток сайта → Configure tag settings →
   Define internal traffic: правило по IP `14.5.115.104` (дом владельца) — оно
   ставит `traffic_type=internal` и на www. Затем Admin → Data filters → Internal
   traffic: перевести из Testing в **Active**. Служебный хост помечается кодом.
4. **Воронки.** Explore → Funnel exploration, по одной на раздел, шаги — события
   из таблиц выше с условием `section = …`. Включить «Open funnel» для Encar (человек
   может прийти сразу на машину из поиска) и breakdown по `device category` —
   мобильный и десктоп ведут себя по-разному.
   Для «почему нет заявок» на машинах — отдельная exploration: Free form, строки
   `block`, значения `Event count` по `view_block` против `form_start` и
   `generate_lead`: видно, до какого блока доходят те, кто НЕ оставил заявку.
5. **Search Console.** Admin → Product links → Search Console links — связать с
   `https://www.kmotors.shop/`, чтобы видеть запросы рядом с поведением.
6. **Проверка.** Admin → DebugView (или расширение Tag Assistant) — пройти воронку
   самому и убедиться, что каждое событие приходит с `section`. Не строить воронки,
   пока DebugView не показал событие: опечатка в имени шага даёт «0» без ошибки.

## Чем дополнить GA4

Цифры покажут, НА КАКОМ шаге уходят; ПОЧЕМУ — видно в Microsoft Clarity
(подключён): записи сессий и тепловые карты страницы машины. В Clarity есть фильтр
по событиям — смотреть сессии, где был `view_item`, но не было `form_start`.
