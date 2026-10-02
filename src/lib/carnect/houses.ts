// Площадки, которые отдаёт carnect.biz, и календарь их торгов.
//
// ⚠️ У carnect два набора идентификаторов, и путать их нельзя:
//   • ПЛОЩАДКА (house) — то, что стоит в адресе списка и лота:
//     /auctions/glovis, /lot/glovis/<lotId>. Их пять, они ниже в HOUSES.
//   • ПУНКТ КАЛЕНДАРЯ — autobell-tue, kcar-sejong и т.п. Это не адреса с
//     данными: /auctions/autobell-tue отдаёт пустую оболочку без лотов
//     (проверено 02.10.2026). Один house делится на несколько пунктов по
//     площадке (venue) и дню недели.
//
// Календарь carnect не приходит с сервера — он зашит константой в их JS
// (снят 02.10.2026 из чанка страницы /auctions). Мы держим СВОЮ копию, а не
// разбираем их бандл: имя чанка меняется на каждой их сборке, и тянуть его
// ради пяти строк — лишние запросы и лишняя хрупкость. Цена — копия может
// отстать от их правок; сверять глазами со страницей /auctions.
//
// Зачем нам календарь вообще. Новая партия у площадки появляется к её дню
// торгов, а между торгами список почти не меняется. Значит, обходить
// площадку имеет смысл около её дня, а не каждые 4 часа все пять подряд —
// это в разы меньше запросов к чужому серверу. Плюс есть бесплатная
// проверка «ничего не изменилось» по lastIngestAt (см. list.ts).

/** Площадка в адресах carnect. */
export type CarnectHouse = "lotte" | "sk" | "glovis" | "kcar" | "autohub";

export type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

export interface HouseInfo {
  house: CarnectHouse;
  /** Как площадку называют клиенты. Autobell — бренд аукциона Hyundai Glovis. */
  name: string;
  /**
   * Дни торгов → площадка (venue из данных лота). Пустая строка — у
   * площадки одна площадка и venue в лотах не заполнено (Lotte, SK).
   */
  sessions: { day: Weekday; venue: string }[];
}

export const HOUSES: Record<CarnectHouse, HouseInfo> = {
  lotte: { house: "lotte", name: "Lotte Auto Auction", sessions: [{ day: "Mon", venue: "" }] },
  sk: { house: "sk", name: "SK Auction", sessions: [{ day: "Tue", venue: "" }] },
  // ⚠️ Autobell торгует три дня с разных площадок. Соответствие день ↔ venue
  // взято из числа лотов: пункт autobell-tue у carnect показывал 565 — ровно
  // столько лотов с venue Bundang, autobell-fri — 880, ровно Sihwa
  // (02.10.2026). Четверговая площадка в тот день была пуста, её venue мы не
  // видели — поэтому не угадываем, а оставляем пустым до первого замера.
  glovis: {
    house: "glovis",
    name: "Autobell (Hyundai Glovis)",
    sessions: [
      { day: "Tue", venue: "Bundang" },
      { day: "Thu", venue: "" },
      { day: "Fri", venue: "Sihwa" },
    ],
  },
  // Совпадает с нашим замером по своему API K Car (CLAUDE.md, «Торги идут
  // ДВАЖДЫ в неделю»): вторник — Седжон, четверг — Осан.
  kcar: {
    house: "kcar",
    name: "K Car",
    sessions: [
      { day: "Tue", venue: "Sejong" },
      { day: "Thu", venue: "Osan" },
    ],
  },
  // ⚠️ carnect подписывает её «Autohub Ansan», а в данных лотов location —
  // Anseong (안성). Пишем как в данных, подпись календаря не источник.
  autohub: { house: "autohub", name: "Autohub", sessions: [{ day: "Wed", venue: "Anseong" }] },
};

export const ALL_HOUSES = Object.keys(HOUSES) as CarnectHouse[];

export function isHouse(v: string | null | undefined): v is CarnectHouse {
  return !!v && v in HOUSES;
}
