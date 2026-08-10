import { loadCustomsResources } from "@/lib/loadLocale";
import CarsDictionaryClient from "./CarsDictionaryClient";

/**
 * Подключает словарь калькуляторов растаможки (`customs`) на маршрутах
 * под /calculator. Ставить ПЕРВЫМ элементом страницы — до компонентов,
 * которые разворачивают ключи из ядер.
 *
 * Клиентская часть переиспользуется от `CarsDictionary`: она ничего не знает
 * про неймспейс и просто регистрирует переданный бандл, поэтому второй такой
 * же компонент был бы копией.
 */
export default function CustomsDictionary({ lang }: { lang: string }) {
  return <CarsDictionaryClient resources={loadCustomsResources(lang)} />;
}
