"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import ContactForm from "./Form";

export default function Header() {
  const pathname = usePathname();

  const linkStyle = (path: string) =>
    pathname === path
      ? { fontWeight: "bold", textDecoration: "underline" }
      : {};

  return (
    <header className="p-5  border-black container border-2 min-h-[15vh] mx-auto flex items-center ">
      <div className="flex justify-between grow ">
        <nav className="flex gap-5 ">
          <Link href="/" style={linkStyle("/")}>
            Главная
          </Link>
          <Link href="/catalog" style={linkStyle("/catalog")}>
            Каталог
          </Link>
          <Link href="/services" style={linkStyle("/services")}>
            Услуги
          </Link>
          <Link href="/contact" style={linkStyle("/contact")}>
            Контакты
          </Link>
        </nav>

        <ContactForm isVisible={false} />
      </div>
    </header>
  );
}
