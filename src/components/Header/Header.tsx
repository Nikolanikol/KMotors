"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import ContactForm from "./Form";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function Header() {
  const pathname = usePathname();

  const linkStyle = (path: string) =>
    pathname === path
      ? { fontWeight: "bold", textDecoration: "underline" }
      : {};

  return (
    <header className="p-5  border-none container border-2 min-h-[15vh] mx-auto flex items-center ">
      <div className="flex justify-between grow items-center ">
        <Link href="/">
          <h1 className="text-2xl font-bol  ">KMotors</h1>
        </Link>
        <nav className=" gap-5  hidden md:flex md:items-center">
          <Link href="/" style={linkStyle("/")}>
            Главная
          </Link>
          <Link href="/catalog" style={linkStyle("/catalog")}>
            Каталог
          </Link>
          <Link href="/catalog2" style={linkStyle("/services")}>
            Наши авто
          </Link>
          <Link href="/contact" style={linkStyle("/contact")}>
            Контакты
          </Link>
        </nav>
        <ToggleGroup
          type="single"
          value="0"
          className=" bg-gray-300 md:hidden rounded-2xl px-2 fixed bottom-[6%] z-40 -translate-x-1/2 left-1/2"
        >
          <ToggleGroupItem value="a">
            {" "}
            <Link href="/" style={linkStyle("/")}>
              Главная
            </Link>
          </ToggleGroupItem>
          <ToggleGroupItem value="b">
            {" "}
            <Link href="/catalog" style={linkStyle("/catalog")}>
              Каталог
            </Link>
          </ToggleGroupItem>
          <ToggleGroupItem value="c">
            {" "}
            <Link href="/services" style={linkStyle("/services")}>
              Услуги
            </Link>
          </ToggleGroupItem>
          <ToggleGroupItem value="c">
            {" "}
            <Link href="/contact" style={linkStyle("/contact")}>
              Контакты
            </Link>
          </ToggleGroupItem>
        </ToggleGroup>
        <ContactForm isVisible={false} />
      </div>
    </header>
  );
}
