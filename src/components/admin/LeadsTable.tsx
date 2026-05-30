"use client";

import { useState, useMemo } from "react";

interface Lead {
  id: string;
  name: string;
  phone: string;
  car_name: string | null;
  source_page: string | null;
  created_at: string;
  messenger: string | null;
  vin: string | null;
  tg_username: string | null;
}

const SOURCE_LABELS: Record<string, string> = {
  car_detail: "Карточка машины",
  car_detail_mobile: "Карточка (моб.)",
  car_calculator: "Калькулятор",
  header: "Шапка сайта",
  contact: "Контакты",
  parts: "Запчасти",
  blog: "Блог",
  unknown: "Неизвестно",
};

const TZ = "Asia/Seoul";
function fmtDate(str: string) {
  return new Date(str).toLocaleString("ru-RU", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ,
  });
}

function exportCSV(leads: Lead[]) {
  const headers = ["Имя", "Телефон", "Машина", "VIN", "Источник", "Мессенджер", "Telegram", "Дата"];
  const rows = leads.map((l) => [
    l.name,
    l.phone,
    l.car_name || "",
    l.vin || "",
    SOURCE_LABELS[l.source_page || ""] || l.source_page || "",
    l.messenger || "",
    l.tg_username || "",
    fmtDate(l.created_at),
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LeadsTable({ leads }: { leads: Lead[] }) {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");

  const sources = useMemo(() => {
    const set = new Set(leads.map((l) => l.source_page || "unknown"));
    return ["all", ...Array.from(set)];
  }, [leads]);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        l.name?.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.car_name?.toLowerCase().includes(q) ||
        l.tg_username?.toLowerCase().includes(q);
      const matchSource = sourceFilter === "all" || (l.source_page || "unknown") === sourceFilter;
      return matchSearch && matchSource;
    });
  }, [leads, search, sourceFilter]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Шапка с поиском и фильтром */}
      <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-1">
          <input
            type="text"
            placeholder="Поиск по имени, телефону, машине..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
          />
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
          >
            <option value="all">Все источники</option>
            {sources.filter((s) => s !== "all").map((s) => (
              <option key={s} value={s}>{SOURCE_LABELS[s] || s}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-gray-400">{filtered.length} из {leads.length}</span>
          <button
            onClick={() => exportCSV(filtered)}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors font-medium"
          >
            ⬇ CSV
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-gray-400">
          {leads.length === 0 ? "Заявок пока нет" : "Ничего не найдено"}
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {filtered.map((lead) => (
            <div key={lead.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">{lead.name}</div>
                <a href={`tel:${lead.phone}`} className="text-orange-500 text-sm hover:underline">
                  {lead.phone}
                </a>
                {lead.car_name && (
                  <div className="text-xs text-gray-400 truncate">{lead.car_name}</div>
                )}
                {lead.vin && (
                  <div className="text-xs text-gray-500 font-mono">VIN: {lead.vin}</div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                {lead.messenger === "whatsapp" && (
                  <a
                    href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    💚 WhatsApp
                  </a>
                )}
                {lead.messenger === "telegram" && (
                  lead.tg_username ? (
                    <a
                      href={`https://t.me/${lead.tg_username.replace(/^@/, "")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      ✈️ {lead.tg_username}
                    </a>
                  ) : (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">✈️ Telegram</span>
                  )
                )}
                <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-lg">
                  {SOURCE_LABELS[lead.source_page || ""] || lead.source_page}
                </span>
                <span className="text-xs text-gray-400">{fmtDate(lead.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
