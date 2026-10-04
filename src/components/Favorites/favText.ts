// Тексты панели избранного. Свой словарь, а не i18next, по той же причине,
// что у корзины (cartText.ts): панель висит в глобальной шапке, то есть на
// любой странице сайта, где нужных разделов словаря может не быть.

const T: Record<string, Record<string, string>> = {
  ru: {
    title: "Избранное", close: "Закрыть", empty: "Пока ничего не сохранено",
    emptyDesc: "Нажмите ♥ на машине или запчасти — она появится здесь.",
    encar: "Машины Encar", auction: "Аукционы", parts: "Запчасти",
    remove: "Убрать из избранного", add: "В избранное",
    auctionOver: "Торги прошли", similar: "Похожие в каталоге →",
    toCars: "Каталог авто", toAuction: "Аукционы", toParts: "Запчасти", clear: "Очистить",
  },
  en: {
    title: "Saved", close: "Close", empty: "Nothing saved yet",
    emptyDesc: "Tap ♥ on a car or a part to keep it here.",
    encar: "Encar cars", auction: "Auctions", parts: "Parts",
    remove: "Remove from saved", add: "Save",
    auctionOver: "Auction over", similar: "Similar in the catalog →",
    toCars: "Car catalog", toAuction: "Auctions", toParts: "Parts", clear: "Clear",
  },
  ko: {
    title: "찜 목록", close: "닫기", empty: "저장된 항목이 없습니다",
    emptyDesc: "차량이나 부품의 ♥를 누르면 여기에 저장됩니다.",
    encar: "엔카 차량", auction: "경매", parts: "부품",
    remove: "찜 해제", add: "찜하기",
    auctionOver: "경매 종료", similar: "카탈로그에서 비슷한 차량 →",
    toCars: "차량 카탈로그", toAuction: "경매", toParts: "부품", clear: "비우기",
  },
  ka: {
    title: "რჩეულები", close: "დახურვა", empty: "ჯერ არაფერია შენახული",
    emptyDesc: "დააჭირეთ ♥-ს მანქანაზე ან ნაწილზე და ის აქ გამოჩნდება.",
    encar: "Encar-ის მანქანები", auction: "აუქციონები", parts: "ნაწილები",
    remove: "რჩეულებიდან ამოღება", add: "რჩეულებში",
    auctionOver: "აუქციონი დასრულდა", similar: "მსგავსი კატალოგში →",
    toCars: "ავტო კატალოგი", toAuction: "აუქციონები", toParts: "ნაწილები", clear: "გასუფთავება",
  },
  ar: {
    title: "المحفوظات", close: "إغلاق", empty: "لا شيء محفوظ بعد",
    emptyDesc: "اضغط ♥ على سيارة أو قطعة لحفظها هنا.",
    encar: "سيارات Encar", auction: "المزادات", parts: "قطع الغيار",
    remove: "إزالة من المحفوظات", add: "حفظ",
    auctionOver: "انتهى المزاد", similar: "مشابهة في الكتالوج ←",
    toCars: "كتالوج السيارات", toAuction: "المزادات", toParts: "قطع الغيار", clear: "مسح",
  },
};

export function favText(lang: string): Record<string, string> {
  return T[lang] ?? T.en;
}

/** Событие «открыть избранное» — кнопки на страницах не тянут к себе состояние шапки. */
export const FAVORITES_OPEN_EVENT = "kaxis_favorites_open";

export function openFavoritesDrawer() {
  window.dispatchEvent(new Event(FAVORITES_OPEN_EVENT));
}
