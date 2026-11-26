import type { PartContent } from "@/lib/partContent";

/**
 * Экспертный блок под карточкой запчасти: что за деталь, чем не путать, как изнашивается,
 * заметки по замене, вопросы покупателя. Серверный компонент — без JS и без клиентского
 * состояния, текст целиком лежит в HTML (ради индексации, это и есть его задача).
 *
 * ⚠️ Текст на АНГЛИЙСКОМ на всех языках сайта (решение владельца 26.11.2026). Поэтому тело
 * блока размечено lang="en" dir="ltr" (на ar страница RTL), а переведён только заголовок и
 * пометка о языке.
 *
 * ⚠️ Источники показываются доменами БЕЗ ссылок: это каталоги-конкуренты (partsro и дилеры),
 * ссылка уводила бы покупателя к ним.
 */

const TITLE: Record<string, string> = {
  ru: "Подробнее о детали",
  en: "About this part",
  ko: "부품 정보",
  ka: "დეტალის შესახებ",
  ar: "عن هذه القطعة",
};

const NOTE: Record<string, string> = {
  ru: "Техническое описание на английском языке.",
  ko: "기술 설명은 영어로 제공됩니다.",
  ka: "ტექნიკური აღწერა ინგლისურ ენაზეა.",
  ar: "الوصف الفني متوفر باللغة الإنجليزية.",
};

function List({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="list-disc pl-5 space-y-1.5 text-[var(--pn-text-muted)] text-sm sm:text-base leading-relaxed">
      {items.map((s) => (
        <li key={s}>{s}</li>
      ))}
    </ul>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base sm:text-lg font-bold text-[var(--pn-text)] mt-7 mb-2.5">{children}</h3>
  );
}

export function PartExpertContent({
  lang,
  partNumber,
  content,
}: {
  lang: string;
  partNumber: string;
  content: PartContent;
}) {
  const c = content;
  const para = "text-[var(--pn-text-muted)] text-sm sm:text-base leading-relaxed";

  return (
    <div className="parts-page bg-[var(--pn-bg)]">
      <section
        aria-labelledby="part-expert-title"
        data-track-block="part_expert_content"
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 lg:pb-14"
      >
        <div className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-2xl p-5 sm:p-8">
          <h2
            id="part-expert-title"
            className="text-2xl sm:text-[28px] font-extrabold text-[var(--pn-text)] leading-tight tracking-tight"
          >
            {TITLE[lang] ?? TITLE.en}
            <span className="ml-3 font-mono text-base sm:text-lg font-bold tracking-[0.06em] text-[var(--pn-text-dim)] whitespace-nowrap">
              {partNumber}
            </span>
          </h2>
          {NOTE[lang] && (
            <p className="mt-2 text-xs text-[var(--pn-text-dim)]">{NOTE[lang]}</p>
          )}

          <div lang="en" dir="ltr" className="mt-4">
            {(c.identity || c.notToConfuseWith) && (
              <div className="space-y-3">
                {c.identity && <p className={para}>{c.identity}</p>}
                {c.notToConfuseWith && (
                  <p className={para}>
                    <strong className="text-[var(--pn-text)]">Do not confuse it with: </strong>
                    {c.notToConfuseWith}
                  </p>
                )}
              </div>
            )}

            {c.pairedPartNumbers.length > 0 && (
              <>
                <H3>Related and replacement part numbers</H3>
                <ul className="space-y-2">
                  {c.pairedPartNumbers.map((p) => (
                    <li key={p.pn} className={`${para} flex flex-wrap items-baseline gap-x-3`}>
                      <span className="font-mono font-bold tracking-[0.06em] text-[var(--pn-orange)]">
                        {p.pn}
                      </span>
                      <span>{p.relation}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {c.howItWorks && (
              <>
                <H3>How it works</H3>
                <p className={para}>{c.howItWorks}</p>
              </>
            )}

            {c.whatHappensWhenItFails && (
              <>
                <H3>What happens when it fails</H3>
                <p className={para}>{c.whatHappensWhenItFails}</p>
              </>
            )}

            {c.failureSigns.length > 0 && (
              <>
                <H3>Signs of wear or failure</H3>
                <List items={c.failureSigns} />
              </>
            )}

            {c.usuallyReplacedWith.length > 0 && (
              <>
                <H3>Usually replaced together with</H3>
                <List items={c.usuallyReplacedWith} />
              </>
            )}

            {c.replacementNotes.length > 0 && (
              <>
                <H3>Replacement notes</H3>
                <List items={c.replacementNotes} />
              </>
            )}

            {c.faq.length > 0 && (
              <>
                <H3>Questions and answers</H3>
                <dl className="space-y-4">
                  {c.faq.map((q) => (
                    <div key={q.question}>
                      <dt className="font-semibold text-[var(--pn-text)] text-sm sm:text-base">
                        {q.question}
                      </dt>
                      <dd className={`${para} mt-1`}>{q.answer}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}

            {c.sources.length > 0 && (
              <p className="mt-7 text-xs text-[var(--pn-text-dim)]">
                Part identification based on catalog data from {c.sources.join(", ")}.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
