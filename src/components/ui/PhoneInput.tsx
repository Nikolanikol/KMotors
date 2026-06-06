"use client";
import dynamic from "next/dynamic";
import { type Value } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";

// Lazy load — библиотека 193KB, грузим только когда форма видна
const ReactPhoneInput = dynamic(() => import("react-phone-number-input"), {
  ssr: false,
  loading: () => (
    <input
      type="tel"
      placeholder="Загрузка..."
      disabled
      className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm border-input"
    />
  ),
});

interface PhoneInputProps {
  value: Value | undefined;
  onChange: (value: Value | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  error?: boolean;
}

export function PhoneInput({ value, onChange, placeholder, disabled, required, className, error }: PhoneInputProps) {
  return (
    <ReactPhoneInput
      international
      defaultCountry="RU"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      numberInputProps={{
        required,
        className: cn(
          "flex-1 min-w-0 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400",
          className
        ),
      }}
      className={cn(
        "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-within:ring-1 gap-2",
        "[&_.PhoneInputCountrySelect]:border-none [&_.PhoneInputCountrySelect]:outline-none [&_.PhoneInputCountrySelect]:text-sm",
        "[&_.PhoneInputCountrySelect]:bg-white [&_.PhoneInputCountrySelect]:text-gray-900",
        "[&_.PhoneInputCountrySelectArrow]:opacity-50",
        error
          ? "border-red-500 focus-within:ring-red-500"
          : "border-input focus-within:ring-ring"
      )}
    />
  );
}
