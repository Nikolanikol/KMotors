import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MODEL_PAGES, getModelBySlug } from "@/data/model-pages";
import CarSlider from "@/components/Home/CarSlider/CarSlider";

export const revalidate = 86400;

const LANGS = ["ru", "en", "ko", "ka", "ar"];

interface Props {
  params: Promise<{ lang: string; slug: string }>;
}

export async function generateStaticParams() {
  return MODEL_PAGES.flatMap((model) =>
    LANGS.map((lang) => ({ lang, slug: model.slug }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) return { title: "Not found | K-Axis" };

  const content = model.content[lang as "ru" | "en"] ?? model.content.ru;

  return {
    title: content.title,
    description: content.subtitle,
    openGraph: {
      title: content.title,
      description: content.subtitle,
      url: `https://kmotors.shop/${lang}/models/${slug}`,
      images: [{ url: `https://kmotors.shop${model.coverImage}`, alt: content.title }],
      type: "website",
    },
    alternates: {
      canonical: `https://kmotors.shop/${lang}/models/${slug}`,
      languages: Object.fromEntries(
        LANGS.map((l) => [l, `https://kmotors.shop/${l}/models/${slug}`])
      ),
    },
  };
}

export default async function ModelPage({ params }: Props) {
  const { lang, slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) notFound();

  const content = model.content[lang as "ru" | "en"] ?? model.content.ru;
  const isRu = lang === "ru";

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "K-Axis", item: `https://kmotors.shop/${lang}/` },
      { "@type": "ListItem", position: 2, name: isRu ? "Каталог" : "Catalog", item: `https://kmotors.shop/${lang}/catalog` },
      { "@type": "ListItem", position: 3, name: `${model.manufacturerEn} ${model.modelKo}`, item: `https://kmotors.shop/${lang}/models/${slug}` },
    ],
  };

  const TG_URL = "https://t.me/KMOTORS_form_bot?start=model_" + slug;
  const WA_URL = `https://wa.me/821058654344?text=${encodeURIComponent(
    isRu
      ? `Здравствуйте! Интересует ${model.manufacturerEn} из Кореи. Бюджет: `
      : `Hello! I'm interested in ${model.manufacturerEn} from Korea. Budget: `
  )}`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main className="min-h-screen">

        {/* Hero */}
        <section className="relative py-20 px-4 overflow-hidden">
          {/* Background image */}
          <div className="absolute inset-0 z-0">
            <Image
              src={model.coverImage}
              alt={`${model.manufacturerEn} ${model.modelKo}`}
              fill
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.75) 100%)" }} />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-5">
            <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest">
              {isRu ? "Авто из Кореи" : "Cars from Korea"}
            </p>
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
              {model.manufacturerEn} {model.modelKo.replace(/[가-힣]+/g, "")} {content.title.split("—")[0].split("из")[0].split("from")[0].trim().split(" ").slice(2).join(" ")}
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              {content.subtitle}
            </p>

            {/* Price badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-2xl px-6 py-3">
              <span className="text-white/60 text-sm">{isRu ? "Цена под ключ:" : "All-in price:"}</span>
              <span className="text-white font-bold text-xl">
                {isRu
                  ? `от ${model.priceFrom.toLocaleString("ru-RU")} 000 ₽`
                  : `from $${Math.round(model.priceFrom * 10.9).toLocaleString("en-US")}`}
              </span>
              <span className="text-white/40 text-sm">
                {isRu
                  ? `до ${model.priceTo.toLocaleString("ru-RU")} 000 ₽`
                  : `to $${Math.round(model.priceTo * 10.9).toLocaleString("en-US")}`}
              </span>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <a
                href={TG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-[#229ED9] hover:bg-[#1a8bc2] text-white font-bold rounded-2xl transition-colors shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.48 13.617l-2.95-.924c-.64-.203-.654-.64.136-.948l11.52-4.44c.532-.194 1 .12.376.943z"/>
                </svg>
                {isRu ? "Узнать цену в Telegram" : "Ask price in Telegram"}
              </a>
              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-[#25D366] hover:bg-[#1db954] text-white font-bold rounded-2xl transition-colors shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
              <Link
                href={`/${lang}/catalog`}
                className="inline-flex items-center justify-center gap-2 px-7 py-4 border-2 border-white/30 text-white hover:bg-white/10 font-bold rounded-2xl transition-colors"
              >
                {isRu ? "Смотреть каталог" : "Browse catalog"}
              </Link>
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="max-w-4xl mx-auto px-4 py-12">
          <p className="text-lg leading-relaxed text-center" style={{ color: "var(--axis-gray)" }}>
            {content.description}
          </p>
        </section>

        {/* Benefits */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              {isRu ? "Почему покупают в K-Axis" : "Why buy from K-Axis"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {content.benefits.map((b, i) => (
                <div key={i} className="p-6 rounded-2xl  border ">
                  <div className="w-10 h-10 rounded-full bg-[var(--axis-orange)]/10 flex items-center justify-center mb-4">
                    <span className="text-[#BB162B] font-bold">{i + 1}</span>
                  </div>
                  <h3 className="font-bold text-white mb-2">{b.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--axis-gray)" }}>{b.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Live cars slider */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              {isRu
                ? `${model.manufacturerEn} в наличии прямо сейчас`
                : `${model.manufacturerEn} available right now`}
            </h2>
            <p className="text-center text-sm mb-6" style={{ color: "var(--axis-gray)" }}>
              {isRu ? "Реальные автомобили с корейского рынка" : "Real cars from the Korean market"}
            </p>
            <CarSlider
              reqString={model.sliderUrl ?? `https://encar-proxy-main.onrender.com/api/catalog?count=true&q=(And.Hidden.N._.SellType.%EC%9D%BC%EB%B0%98._.(C.CarType.A._.Manufacturer.${encodeURIComponent(model.manufacturer)}.))&sr=%7CModifiedDate%7C0%7C20`}
              title=""
            />
            <div className="text-center mt-6">
              <Link
                href={`/${lang}/catalog?manufacture=${encodeURIComponent(model.manufacturerEn)}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all"
                style={{ backgroundColor: "var(--axis-orange)", color: "white" }}
              >
                {isRu
                  ? `Все ${model.manufacturerEn} в каталоге →`
                  : `All ${model.manufacturerEn} in catalog →`}
              </Link>
            </div>
          </div>
        </section>

        {/* How to buy */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              {isRu ? "Как купить" : "How to buy"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {content.steps.map((step, i) => (
                <div key={i} className="text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--axis-orange)] text-white font-bold text-lg flex items-center justify-center mx-auto">
                    {i + 1}
                  </div>
                  <h3 className="font-bold text-white text-sm">{step.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href={`/${lang}/buy`}
                className="inline-flex items-center gap-2 text-[var(--axis-orange)] hover:text-[var(--axis-orange-bright)] font-semibold text-sm transition-colors"
              >
                {isRu ? "Подробная инструкция →" : "Detailed guide →"}
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 px-4 ">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              {isRu ? "Частые вопросы" : "FAQ"}
            </h2>
            <div className="space-y-4">
              {content.faq.map((item, i) => (
                <div key={i} className="rounded-2xl p-6" style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}>
                  <h3 className="font-bold text-white mb-3">{item.q}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--axis-gray)" }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-12 px-4 bg-gradient-to-r from-[var(--axis-charcoal)] to-[var(--axis-black)]">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">
              {isRu
                ? `Хотите ${model.manufacturerEn} из Кореи?`
                : `Want a ${model.manufacturerEn} from Korea?`}
            </h2>
            <p className="text-white/60">
              {isRu
                ? "Напишите нам — подберём вариант под ваш бюджет и требования. Ответим в течение 1 часа."
                : "Write to us — we'll find the right option for your budget. Response within 1 hour."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <a
                href={TG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#229ED9] hover:bg-[#1a8bc2] text-white font-bold rounded-2xl transition-colors"
              >
                Telegram
              </a>
              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#25D366] hover:bg-[#1db954] text-white font-bold rounded-2xl transition-colors"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
