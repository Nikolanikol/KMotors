"use client";

import { useState } from "react";

const TABS = [
  { id: "overview",  label: "📊 Обзор"   },
  { id: "yandex",   label: "🔴 Яндекс"  },
  { id: "ga4",      label: "🟠 GA4"     },
  { id: "leads",    label: "📋 Заявки"  },
  { id: "search",   label: "🔍 Поиск"   },
] as const;

type TabId = typeof TABS[number]["id"];

interface Props {
  overview: React.ReactNode;
  yandex:   React.ReactNode;
  ga4:      React.ReactNode;
  leads:    React.ReactNode;
  search:   React.ReactNode;
}

export default function AdminTabs({ overview, yandex, ga4, leads, search }: Props) {
  const [active, setActive] = useState<TabId>("overview");

  const content: Record<TabId, React.ReactNode> = { overview, yandex, ga4, leads, search };

  return (
    <div>
      {/* Таб-бар */}
      <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 px-4">
        <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className="flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors border-b-2"
              style={{
                borderColor:  active === tab.id ? "#002C5F" : "transparent",
                color:        active === tab.id ? "#002C5F" : "#6b7280",
                background:   "transparent",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Контент активного таба */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {content[active]}
      </div>
    </div>
  );
}
