"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import ContactForm from "./Form";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
export interface NavLink {
  href: string;
  label: string;
}
export default function Header() {
  const pathname = usePathname();

  const navLinks: NavLink[] = [
    { href: "/", label: "Главная" },
    { href: "/catalog", label: "Каталог" },
    { href: "/catalog2", label: "Наши авто" },
    { href: "/buy", label: "Порядок работы" },
    { href: "/contact", label: "Контакты" },
  ];
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
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} style={linkStyle(link.href)}>
              {link.label}
            </Link>
          ))}
        </nav>
        <ToggleGroup
          type="single"
          value="0"
          className=" bg-gray-300 md:hidden rounded-2xl px-2 fixed bottom-[6%] z-40 -translate-x-1/2 left-1/2"
        >
          <nav className=" flex flex-nowrap">
            {navLinks.map((link) => (
              <ToggleGroupItem key={link.href} value={link.href}>
                <Link href={link.href} style={linkStyle(link.href)}>
                  {link.label}
                </Link>
              </ToggleGroupItem>
            ))}
          </nav>
        </ToggleGroup>

        <ContactForm isVisible={false} />
      </div>
    </header>
  );
}
