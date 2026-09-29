// Детальная страница лота аукциона — служебная, под тем же гейтом /admin.
//
// Показывает ВСЁ, что удалось зеркалить: спецификацию из списочного ответа
// плюс поля добора (VIN, галерея, лист осмотра, схема повреждений). Добор
// приходит со сторонней витрины и может отсутствовать — страница обязана
// рисоваться и без него, поэтому каждый блок проверяет свои данные сам.
//
// ⚠️ Пустой лист осмотра означает «повреждений не нашли», а НЕ «данных нет»:
// витрина отдаёт только повреждённые узлы, целые в ответ не приходят. Эти два
// случая на экране разведены явно — иначе менеджер прочитает отсутствие
// данных как исправный кузов.

import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { BadgeCheck, Calendar, Car, Fuel, Gauge, Settings2 } from "lucide-react";

import Carousel from "@/components/Catalog/CarDetail/Carousel/Carousel";
import OverviewStrip from "@/components/Auction/OverviewStrip";
import { SpecCard, SpecRows } from "@/components/Auction/SpecCard";
import { yearWithAge } from "@/components/Auction/carAge";
import { auctionStatus, readableKorean } from "@/lib/kcar/dict";
import { estimateHammer } from "@/lib/kcar/estimate";
import { getLot, getPremiumIndex } from "@/lib/kcar/query";

export const dynamic = "force-dynamic";

const krw = (v: number | null | undefined) => (v == null ? "—" : `${v.toLocaleString("ru-RU")} ₩`);

const NOTICE_TONE: Record<string, string> = {
  block: "#C4563F",
  bad: "#C4563F",
  warn: "var(--axis-bronze)",
  info: "var(--axis-gray)",
};

export default async function LotPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || session.value !== "1") redirect("/admin/login");

  const { id } = await params;
  const [lot, premiumIndex] = await Promise.all([getLot(id), getPremiumIndex()]);
  if (!lot) notFound();

  const estimate = estimateHammer(lot, premiumIndex);
  const title = [lot.maker, lot.model].filter(Boolean).join(" ") || lot.external_id;
  const trimLabel = readableKorean(lot.trim);

  // Опись состояния делится по тому, дошёл ли словарь до конца строки.
  const HANGUL = /[\u3131-\uD79D]/;
  const conditions = lot.conditions ?? [];
  const cleanConditions = conditions.filter((c) => !HANGUL.test(c));
  const partialConditions = conditions.filter((c) => HANGUL.test(c));
  const gallery = lot.photos?.length ? lot.photos : lot.thumb_url ? [lot.thumb_url] : [];
  const inspectionEntries = Object.entries(lot.inspection ?? {});
  const enriched = lot.inspection !== null || lot.photos?.length > 0 || !!lot.vin;

  return (
    <main className="min-h-screen px-4 py-6" style={{ backgroundColor: "var(--background, #0A0A0A)" }}>
      <div className="mx-auto max-w-6xl">
        <Link href="/admin/auction" className="text-xs" style={{ color: "var(--axis-bronze)" }}>
          ← к списку лотов
        </Link>

        <header className="mb-5 mt-3">
          <h1 className="text-2xl font-semibold" style={{ color: "var(--axis-cream, #F5F0EB)" }}>
            {title} {lot.year ? <span style={{ color: "var(--axis-gray)" }}>· {lot.year}</span> : null}
          </h1>
          {/*
            ⚠️ Раньше строка склеивала trim и name_ko — и получалось «640d
            xDrive 그란쿠페 · BMW 6시리즈 (F12) 640d xDrive 그란쿠페»: одно и то
            же дважды, наполовину хангылем. Комплектация входит в корейское
            название целиком, поэтому показываем ОДНУ строку и без хангыля;
            сырое имя площадки осталось в карточке «Служебное», где ему и место.
          */}
          {trimLabel && (
            <p className="mt-1 text-sm" style={{ color: "var(--axis-gray)" }}>
              {trimLabel}
            </p>
          )}
          <p className="mt-1 text-xs" style={{ color: "var(--axis-gray)" }}>
            {lot.external_id} · {lot.auction_date ?? "дата неизвестна"} · {lot.site ?? "площадка неизвестна"}
            {lot.lane ? ` · полоса ${lot.lane}` : ""}
            {lot.lot_no != null ? ` · лот ${lot.lot_no}` : ""}
          </p>
        </header>

        {!enriched && (
          <p
            className="mb-4 rounded-xl p-3 text-xs"
            style={{ backgroundColor: "var(--axis-charcoal)", color: "var(--axis-bronze)" }}
          >
            Добор по этому лоту не проходил: нет VIN, галереи и листа осмотра. Показано то, что
            отдаёт списочный ответ площадки.
          </p>
        )}

        {gallery.length > 0 && (
          // ⚠️ 70% ширины только с lg. На телефоне те же 70% дали бы кадр в
          // ~260px — меньше, чем был грид, ради которого всё и затевалось.
          <div className="mb-5 w-full lg:w-[70%]">
            {/*
              Та же галерея, что на карточке авто и на лоте Lotte: лайтбокс с
              зумом грузится только по клику.

              ⚠️ imageSource="raw" обязателен: по умолчанию компонент дописывает
              к адресам параметры Encar с водяным знаком, а тут фото с CDN
              аукциона KCar. Он к тому же отдаёт .JPG с content-type image/gif,
              из-за чего оптимизатору Next эти адреса доверять нельзя.

              ⚠️ labels тоже обязательны: страница вне [lang], инстанса i18next
              здесь нет, и без них в aria-label ушли бы сырые ключи.
            */}
            <Carousel
              photos={gallery}
              mode="static"
              imageSource="raw"
              carName={title}
              photoLabel="фото"
              labels={{
                open: "Открыть галерею",
                prev: "Предыдущее фото",
                next: "Следующее фото",
                close: "Закрыть галерею",
              }}
            />
          </div>
        )}

        <div className="mb-3">
          <OverviewStrip
            items={[
              { icon: <Car size={20} />, label: "Модель", value: lot.model },
              { icon: <Fuel size={20} />, label: "Топливо", value: lot.fuel },
              { icon: <Calendar size={20} />, label: "Год", value: yearWithAge(lot.year) },
              { icon: <Settings2 size={20} />, label: "Коробка", value: lot.transmission },
              {
                icon: <Gauge size={20} />,
                label: "Пробег",
                value: lot.mileage_km != null ? `${lot.mileage_km.toLocaleString("ru-RU")} км` : null,
              },
              {
                // У KCar шестой пункт свой: привода в данных нет, а оценка
                // кузова площадкой есть у каждого лота и решает в торгах больше.
                icon: <BadgeCheck size={20} />,
                label: "Оценка кузова",
                value: lot.grade_ext ? `${lot.grade_ext} из 9` : null,
              },
            ]}
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <SpecCard title="Цены">
            <SpecRows
              rows={[
                { label: "Старт", value: krw(lot.start_price_krw) },
                { label: "Резерв продавца", value: krw(lot.reserve_price_krw) },
                { label: "Молоток", value: krw(lot.hammer_price_krw) },
                {
                  label: "Прогноз молотка",
                  accent: true,
                  value:
                    estimate ? (
                    <span>
                      {krw(estimate.hammerKrw)} · +{estimate.premiumPct}% ·{" "}
                      <span style={{ color: "var(--axis-gray)" }}>
                        {estimate.basis === "model"
                          ? `по ${estimate.sampleSize} сделкам модели`
                          : estimate.basis === "grade"
                            ? `по классу, ${estimate.sampleSize} сделок`
                            : `по рынку, ${estimate.sampleSize} сделок`}
                      </span>
                    </span>
                  ) : null,
                },
                { label: "Статус", value: auctionStatus(lot.status) },
              ]}
            />
          </SpecCard>

          <SpecCard title="Спецификация">
            <SpecRows
              rows={[
                // Пробег, топливо и коробка стоят выше в плашке.
                { label: "Первая регистрация", value: lot.first_reg },
                { label: "Цвет", value: lot.color },
                { label: "Происхождение", value: lot.usage },
                { label: "Объём двигателя", value: lot.engine_cc ? `${lot.engine_cc} см³` : null },
                { label: "Кузов", value: lot.body_type },
                { label: "Мест", value: lot.seats },
                { label: "Привод", value: lot.drive },
                { label: "Госномер", value: lot.plate, mono: true },
                { label: "VIN", value: lot.vin, mono: true },
              ]}
            />
          </SpecCard>

          <SpecCard title="Оценка площадки">
            <SpecRows
              rows={[
                { label: "Класс лота", value: lot.grade_int, accent: true },
                { label: "Дефектов", value: lot.defect_count },
                {
                  label: "Повреждённые узлы",
                  value: lot.defect_parts?.length ? lot.defect_parts.join(", ") : null,
                },
                { label: "Залогов", value: lot.mortgages || null },
                { label: "Арестов", value: lot.seizures || null },
                { label: "Срок документов", value: lot.doc_days ? `${lot.doc_days} дн.` : null },
              ]}
            />
          </SpecCard>

          <SpecCard title="Лист осмотра">
            {lot.inspection === null ? (
              <p className="text-xs" style={{ color: "var(--axis-gray)" }}>
                данных нет — добор по лоту не проходил
              </p>
            ) : inspectionEntries.length === 0 ? (
              <p className="text-xs" style={{ color: "#5FA463" }}>
                повреждений не найдено (витрина отдаёт только повреждённые узлы)
              </p>
            ) : (
              <SpecRows rows={inspectionEntries.map(([label, value]) => ({ label, value }))} />
            )}
          </SpecCard>

          <SpecCard title="Примечание аукциониста">
            {lot.blocked_export && (
              <p className="mb-3 text-sm font-semibold" style={{ color: "#C4563F" }}>
                Ставки экспортёрам запрещены
              </p>
            )}

            {lot.notices?.length > 0 && (
              <ul className="mb-3 space-y-1.5">
                {lot.notices.map((n, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-sm"
                    style={{ color: NOTICE_TONE[n.level] ?? "var(--axis-white)" }}
                  >
                    <span aria-hidden>•</span>
                    <span>{n.text}</span>
                  </li>
                ))}
              </ul>
            )}

            {/*
              ⚠️ Опись состояния РАЗВЕДЕНА по полноте разбора, и это не
              придирка. Словарь покрывает ~86% позиций, поэтому часть строк
              выходит наполовину: «двигатель 룸 백연발생». Выбросить из них
              корейское слово нельзя — останется «двигатель», что прямо вводит
              в заблуждение. Слитые в одну строку через «·», переведённые и
              полупереведённые куски были неотличимы, и весь блок читался как
              каша. Теперь понятное — списком, непонятное — отдельно и честно
              подписано.
            */}
            {cleanConditions.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {cleanConditions.map((c) => (
                  <span
                    key={c}
                    className="rounded-md px-2 py-1 text-xs"
                    style={{
                      backgroundColor: "var(--axis-graphite)",
                      color: "var(--axis-white)",
                      border: "1px solid rgba(74,74,74,0.3)",
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}

            {partialConditions.length > 0 && (
              <div className="mb-3">
                <p className="mb-1.5 text-xs" style={{ color: "var(--axis-gray)" }}>
                  Разобрано частично — сверяться с оригиналом:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {partialConditions.map((c) => (
                    <span
                      key={c}
                      className="rounded-md px-2 py-1 text-xs"
                      style={{
                        backgroundColor: "var(--axis-graphite)",
                        color: "var(--axis-gray)",
                        border: "1px dashed rgba(182,119,73,0.4)",
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {lot.remarks && (
              // Оригинал свёрнут: он занимает пол-экрана хангылем, а нужен
              // только когда разбор оказался неполным. <details> вместо
              // состояния — компонент серверный, JS для этого не нужен.
              <details>
                <summary className="cursor-pointer text-xs" style={{ color: "var(--axis-bronze)" }}>
                  Оригинал примечания
                </summary>
                <p
                  className="mt-2 whitespace-pre-wrap text-xs leading-relaxed"
                  style={{ color: "var(--axis-gray)" }}
                >
                  {lot.remarks}
                </p>
              </details>
            )}
          </SpecCard>

          <SpecCard title="Служебное">
            <SpecRows
              rows={[
                { label: "Площадка", value: lot.source },
                { label: "Имя у площадки", value: lot.name_ko },
                { label: "Код торгов", value: lot.auction_code },
                { label: "Окно торгов", value: lot.auction_window },
                { label: "Фотографий", value: lot.photo_count || null },
                {
                  label: "Источник добора",
                  value:
                  lot.source_url ? (
                    <a href={lot.source_url} target="_blank" rel="noreferrer" style={{ color: "var(--axis-bronze)" }}>
                      открыть
                    </a>
                  ) : null,
                },
                {
                  label: "Схема повреждений",
                  value: lot.diagram_url ? (
                    <a href={lot.diagram_url} target="_blank" rel="noreferrer" style={{ color: "var(--axis-bronze)" }}>
                      открыть
                    </a>
                  ) : null,
                },
                { label: "Впервые увиден", value: lot.first_seen_at?.slice(0, 16).replace("T", " ") },
                { label: "Обновлён", value: lot.updated_at?.slice(0, 16).replace("T", " ") },
              ]}
            />
          </SpecCard>
        </div>
      </div>
    </main>
  );
}
