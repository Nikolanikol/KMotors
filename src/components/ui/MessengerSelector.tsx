"use client";
import { Input } from "@/components/ui/input";

const WA_ICON = (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.533 5.843L0 24l6.335-1.508A11.956 11.956 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.372l-.36-.214-3.724.977.994-3.634-.234-.374A9.818 9.818 0 0 1 2.182 12C2.182 6.575 6.575 2.182 12 2.182S21.818 6.575 21.818 12 17.425 21.818 12 21.818z"/>
  </svg>
);

const TG_ICON = (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

interface MessengerSelectorProps {
  messenger: string;
  onMessengerChange: (value: string) => void;
  tgUsername: string;
  onTgUsernameChange: (value: string) => void;
  label: string;
  usernamePlaceholder?: string;
}

export function MessengerSelector({
  messenger,
  onMessengerChange,
  tgUsername,
  onTgUsernameChange,
  label,
  usernamePlaceholder = "@username",
}: MessengerSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onMessengerChange("whatsapp")}
          className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border-2 text-xs font-medium transition-all"
          style={
            messenger === "whatsapp"
              ? { borderColor: "#25D366", color: "#25D366", backgroundColor: "#25D36612" }
              : { borderColor: "#e5e7eb", color: "#6b7280" }
          }
        >
          <span style={{ color: messenger === "whatsapp" ? "#25D366" : "#9ca3af" }}>{WA_ICON}</span>
          WhatsApp
        </button>
        <button
          type="button"
          onClick={() => onMessengerChange("telegram")}
          className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border-2 text-xs font-medium transition-all"
          style={
            messenger === "telegram"
              ? { borderColor: "#229ED9", color: "#229ED9", backgroundColor: "#229ED912" }
              : { borderColor: "#e5e7eb", color: "#6b7280" }
          }
        >
          <span style={{ color: messenger === "telegram" ? "#229ED9" : "#9ca3af" }}>{TG_ICON}</span>
          Telegram
        </button>
      </div>
      {messenger === "telegram" && (
        <Input
          value={tgUsername}
          onChange={(e) => onTgUsernameChange(e.target.value)}
          placeholder={usernamePlaceholder}
          className="text-sm text-gray-900 placeholder:text-gray-400"
          required
        />
      )}
    </div>
  );
}
