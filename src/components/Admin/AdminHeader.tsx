"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, X, BarChart3, Car } from "lucide-react";

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Логотип */}
          <Link
            href="/admin/cars"
            className="text-2xl font-bold flex items-center gap-2"
          >
            <Car className="w-6 h-6 text-blue-400" />
            KMotors Admin
          </Link>

          {/* Меню - десктоп */}
          <nav className="hidden md:flex gap-1">
            <Link
              href="/admin/cars"
              className={`flex items-center gap-2 py-2 px-4 rounded transition ${
                isActive("/admin/cars")
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-700 text-gray-300"
              }`}
            >
              <Car className="w-4 h-4" />
              Авто
            </Link>
            <Link
              href="/admin/analytics"
              className={`flex items-center gap-2 py-2 px-4 rounded transition ${
                isActive("/admin/analytics")
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-700 text-gray-300"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Аналитика
            </Link>
          </nav>

          {/* Выход - десктоп */}
          <button
            onClick={handleLogout}
            className="hidden md:inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Выход
          </button>

          {/* Мобильное меню кнопка */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Мобильное меню - раскрывающееся */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 space-y-2 border-t border-gray-700 pt-4">
            <Link
              href="/admin/cars"
              className={`block py-2 px-3 rounded transition ${
                isActive("/admin/cars") ? "bg-blue-600" : "hover:bg-gray-700"
              }`}
            >
              🚗 Авто
            </Link>
            <Link
              href="/admin/analytics"
              className={`block py-2 px-3 rounded transition ${
                isActive("/admin/analytics")
                  ? "bg-blue-600"
                  : "hover:bg-gray-700"
              }`}
            >
              📊 Аналитика
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left py-2 px-3 bg-red-600 hover:bg-red-700 rounded transition text-sm"
            >
              🚪 Выход
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
