"use client";
import ReactPhoneInput, { type Value } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value: Value | undefined;
  onChange: (value: Value | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function PhoneInput({ value, onChange, placeholder, disabled, required, className }: PhoneInputProps) {
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
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring gap-2 [&_.PhoneInputCountrySelect]:bg-transparent [&_.PhoneInputCountrySelect]:border-none [&_.PhoneInputCountrySelect]:outline-none [&_.PhoneInputCountrySelect]:text-sm [&_.PhoneInputCountrySelectArrow]:opacity-50"
    />
  );
}
