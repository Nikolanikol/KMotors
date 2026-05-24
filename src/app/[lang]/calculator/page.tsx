import { Metadata } from "next";
import CalculatorPage from "@/components/Calculator/CalculatorPage";

interface Props {
  params: Promise<{ lang: string }>;
}

const META: Record<string, { title: string; description: string }> = {
  ru: {
    title: "Калькулятор растаможки авто из Кореи 2026 | K-Axis",
    description:
      "Рассчитайте стоимость растаможки корейского автомобиля в Россию, Казахстан или Узбекистан. Актуальные ставки пошлин 2026 для физических лиц. Онлайн-калькулятор.",
  },
  en: {
    title: "Korean Car Import Duty Calculator 2026 | K-Axis",
    description:
      "Calculate import customs duties for Korean cars to Russia, Kazakhstan or Uzbekistan. Updated 2026 rates for individuals.",
  },
  ko: {
    title: "한국 자동차 통관 관세 계산기 2026 | K-Axis",
    description:
      "러시아, 카자흐스탄, 우즈베키스탄으로 한국 자동차 수입 관세를 계산하세요. 2026년 최신 요율.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const meta = META[lang] ?? META.ru;
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function Page({ params }: Props) {
  const { lang } = await params;
  return <CalculatorPage lang={lang} />;
}
