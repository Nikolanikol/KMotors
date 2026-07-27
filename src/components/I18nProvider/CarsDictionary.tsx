import { loadCarsResources } from "@/lib/loadLocale";
import CarsDictionaryClient from "./CarsDictionaryClient";

/**
 * Подключает словарь Encar (`cars`) на маршрутах, где вызывается
 * translateGenerationRow. Ставить ПЕРВЫМ элементом в разметке страницы —
 * до компонентов, которые переводят характеристики авто.
 *
 * Зачем на уровне страницы, а не в [lang]/layout: layout при клиентской
 * навигации внутри [lang] не перерисовывается, поэтому переход /parts → /catalog
 * не донёс бы до каталога словарь и характеристики остались бы на корейском.
 * Страницы же перерисовываются на каждый переход.
 *
 * Потребители (grep translateGenerationRow): каталог (Filter, CarCard),
 * карточка авто (Header, DetailInfo), избранное, сравнение, а также главная и
 * страница модели — через CarSlider → CarCard.
 */
export default function CarsDictionary({ lang }: { lang: string }) {
  return <CarsDictionaryClient resources={loadCarsResources(lang)} />;
}
