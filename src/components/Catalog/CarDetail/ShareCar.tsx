"use client";

import { Share2, Check, User, Briefcase } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

// Канонический хост публичного сайта. Всё остальное, что доезжает до браузера
// (служебный поддомен за Cloudflare Access), — рабочий вход менеджера, см.
// CLAUDE.md, раздел «Владельческий вход».
const CANONICAL_HOST = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kmotors.shop"
).hostname;

const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

type Props = { title: string };

/**
 * Кнопка «Поделиться» в карточке авто.
 *
 * На публичном www — одна кнопка, отдаёт текущий адрес.
 * На служебном хосте — две: клиенту уходит ссылка на www (он до служебного
 * хоста всё равно не дойдёт, там Access), менеджеру — на служебный хост, чтобы
 * она открылась у него из Кореи в обход гео-блока.
 */
const ShareCar = ({ title }: Props) => {
  const { t } = useTranslation(["common"]);
  const pathname = usePathname();
  const [host, setHost] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Хост читается только после монтирования: на сервере window нет, а первая
  // клиентская отрисовка обязана совпасть с серверной разметкой. До эффекта
  // компонент показывает публичный вариант — он же и остаётся на www.
  useEffect(() => setHost(window.location.hostname), []);

  const onServiceHost =
    host !== null && host !== CANONICAL_HOST && !LOCAL_HOSTS.includes(host);

  const share = async (url: string, key: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch { /* пользователь закрыл системную шторку */ }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* ignore */ }
  };

  const clientUrl = `https://${CANONICAL_HOST}${pathname}`;
  const managerUrl = `https://${host}${pathname}`;

  const button = (
    key: string,
    url: string,
    label: string,
    Icon: typeof Share2
  ) => (
    <button
      key={key}
      type="button"
      onClick={() => share(url, key)}
      className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200"
      style={{
        backgroundColor: "var(--axis-graphite)",
        color: copied === key ? "var(--axis-white)" : "var(--axis-orange)",
        border: "1px solid rgba(182,119,73,0.3)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(182,119,73,0.6)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(182,119,73,0.3)";
      }}
    >
      {copied === key ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
      {copied === key ? t("common:car.linkCopied") : label}
    </button>
  );

  if (!onServiceHost) {
    return button("page", clientUrl, t("common:car.share"), Share2);
  }

  return (
    <>
      {button("client", clientUrl, t("common:car.shareClient"), User)}
      {button("manager", managerUrl, t("common:car.shareManager"), Briefcase)}
    </>
  );
};

export default ShareCar;
