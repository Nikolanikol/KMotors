import { loadSectionResources, type RouteSection } from "@/lib/loadLocale";
import SectionDictionaryClient from "./SectionDictionaryClient";

/**
 * Подключает разделы `common` из ROUTE_SECTIONS на их маршрутах.
 *
 * Эти разделы намеренно исключены из глобального набора в [lang]/layout: втроём
 * они занимают 65% словаря, а нужны лишь своим страницам (замер 22.08.2026).
 * Ставить ПЕРВЫМ элементом в разметке страницы — до компонентов, которые
 * переводят её тексты.
 *
 * Зачем на уровне страницы, а не в layout: layout под [lang] при клиентской
 * навигации не перерисовывается, поэтому переход с главной на /parts не донёс бы
 * словарь. Страницы же перерисовываются на каждый переход.
 *
 * Потребители: /parts (каталог, товар, категория), /fitment, /cart — раздел
 * `parts`; /buy — `buy`; /tracking — `tracking`.
 */
export default function SectionDictionary({
  lang,
  sections,
}: {
  lang: string;
  sections: readonly RouteSection[];
}) {
  return <SectionDictionaryClient resources={loadSectionResources(lang, sections)} />;
}
