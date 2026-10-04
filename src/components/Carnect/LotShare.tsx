"use client";

// «Поделиться» на странице машины аукциона — механика кнопки Encar (ShareCar):
// на телефоне системное меню «поделиться», на компьютере — копия ссылки.
//
// Своя кнопка, а не ShareCar: та берёт подписи из словаря i18next по языку
// сайта, и на /ru английская страница аукциона заговорила бы по-русски.
//
// На служебном хосте кнопок две, как у Encar: клиенту — ссылка на www (до
// служебного хоста он не дойдёт, там Access), менеджеру — на служебный хост.
// ⚠️ Хост читается в useEffect: первая отрисовка обязана совпасть с серверной
// (страница кешируется и одна на оба хоста), поэтому вторая кнопка появляется
// после монтирования. Определение хоста — как в ShareCar / serviceHost.ts.

import { Briefcase, Check, Share2, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { pick, type CardLang, type Pair } from "@/lib/carnect/lang";

const CANONICAL_HOST = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kmotors.shop").hostname;
const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

const T = {
  share: ["Поделиться", "Share"],
  copied: ["Ссылка скопирована", "Link copied"],
  client: ["Клиенту", "For client"],
  manager: ["Менеджеру", "For manager"],
} satisfies Record<string, Pair>;

export default function LotShare({ title, lang }: { title: string; lang: CardLang }) {
  const pathname = usePathname();
  const [host, setHost] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => setHost(window.location.hostname), []);
  const service = host !== null && host !== CANONICAL_HOST && !LOCAL_HOSTS.includes(host);

  const share = async (url: string, key: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch (e) {
      // Закрыл системное меню — это не ошибка. Прочие отказы — копируем ссылку.
      if ((e as Error).name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      // Буфер обмена недоступен (не https, запрет браузера) — молча, как у ShareCar.
    }
  };

  const btn = (key: string, url: string, icon: React.ReactNode, label: string) => (
    <button
      key={key}
      type="button"
      onClick={() => share(url, key)}
      className="flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-all hover:scale-105 active:scale-95"
      style={{
        backgroundColor: "rgba(10,10,10,0.55)",
        border: "1.5px solid rgba(255,255,255,0.18)",
        color: copied === key ? "var(--axis-bronze)" : "var(--axis-cream, #F5F0EB)",
      }}
    >
      {copied === key ? <Check className="h-4 w-4" /> : icon}
      {copied === key ? pick(lang, T.copied) : label}
    </button>
  );

  const clientUrl = `https://${CANONICAL_HOST}${pathname}`;
  if (!service) return btn("public", clientUrl, <Share2 className="h-4 w-4" />, pick(lang, T.share));
  return (
    <div className="flex flex-wrap gap-2">
      {btn("client", clientUrl, <User className="h-4 w-4" />, pick(lang, T.client))}
      {btn("manager", `https://${host}${pathname}`, <Briefcase className="h-4 w-4" />, pick(lang, T.manager))}
    </div>
  );
}
