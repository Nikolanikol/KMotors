"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import * as SelectPrimitive from "@radix-ui/react-select";
import { type Value } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem } from "@/components/ui/select";
import en from "react-phone-number-input/locale/en.json";
import ru from "react-phone-number-input/locale/ru.json";
import ko from "react-phone-number-input/locale/ko.json";
import ar from "react-phone-number-input/locale/ar.json";

// Библиотека не поддерживает грузинский — откатываемся на английские названия стран
const COUNTRY_LABELS: Record<string, typeof en> = { en, ru, ko, ar, ka: en };

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

// "ZZ" — служебное значение для варианта "International" (тот же приём, что в самой библиотеке)
const INTERNATIONAL = "ZZ";

interface CountryOption {
  value?: string;
  label: string;
  divider?: boolean;
}

function findSelectedOption(options: CountryOption[], value?: string) {
  return options.find((option) => !option.divider && (option.value ?? undefined) === (value ?? undefined));
}

// Полная замена дефолтного CountrySelectWithIcon библиотеки (не только внутреннего
// <select>!). countrySelectComponent подменяет собой всю разметку страны — обёртку,
// флаг и стрелку тоже, — поэтому здесь нужно воспроизвести все три части.
// Причина замены: нативный <select> на мобильных (Android Chrome, iOS Safari) рендерит
// список силами ОС и игнорирует CSS страницы — dropdown был светлым вне зависимости от темы.
// Radix рендерит popup сам, поэтому он полностью управляется нашими стилями.
function PhoneCountrySelect({
  value,
  onChange,
  options,
  iconComponent: Icon,
  disabled,
  readOnly,
  name,
  onFocus,
  onBlur,
  ...rest
}: {
  value?: string;
  onChange: (value: string | undefined) => void;
  options: CountryOption[];
  iconComponent: React.ComponentType<{ country?: string; label?: string; "aria-hidden"?: boolean }>;
  disabled?: boolean;
  readOnly?: boolean;
  name?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  "aria-label"?: string;
}) {
  const selectedOption = findSelectedOption(options, value);

  return (
    <div className="PhoneInputCountry">
      <Select
        value={value ?? INTERNATIONAL}
        onValueChange={(v) => onChange(v === INTERNATIONAL ? undefined : v)}
        disabled={disabled || readOnly}
      >
        {/* Невидимая кликабельная область поверх флага — позиционирование берёт
            на себя CSS библиотеки для класса .PhoneInputCountrySelect */}
        <SelectPrimitive.Trigger
          className="PhoneInputCountrySelect"
          name={name}
          onFocus={onFocus}
          onBlur={onBlur}
          {...rest}
        />
        <SelectContent className="max-h-72">
          {options
            .filter((option) => !option.divider)
            .map((option) => (
              <SelectItem key={option.value ?? INTERNATIONAL} value={option.value ?? INTERNATIONAL}>
                <span className="inline-flex items-center gap-2">
                  <Icon country={option.value} label={option.label} />
                  {option.label}
                </span>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      <Icon aria-hidden country={value} label={selectedOption?.label ?? ""} />
      <div className="PhoneInputCountrySelectArrow" />
    </div>
  );
}

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
  const { i18n } = useTranslation();
  return (
    <ReactPhoneInput
      international
      defaultCountry="RU"
      labels={COUNTRY_LABELS[i18n.language] ?? ru}
      countrySelectComponent={PhoneCountrySelect}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      numberInputProps={{
        required,
        // По умолчанию светлый текст: большинство форм на сайте (заявки на авто) —
        // тёмные карточки. Светлые формы (запчасти) переопределяют через className.
        className: cn(
          "flex-1 min-w-0 bg-transparent outline-none text-sm text-[var(--axis-white)] placeholder:text-gray-400",
          className
        ),
      }}
      className={cn(
        "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-within:ring-1 gap-2",
        "[&_.PhoneInputCountry]:relative [&_.PhoneInputCountry]:flex [&_.PhoneInputCountry]:items-center [&_.PhoneInputCountry]:shrink-0",
        "[&_.PhoneInputCountrySelect]:!absolute [&_.PhoneInputCountrySelect]:!inset-0 [&_.PhoneInputCountrySelect]:!opacity-0 [&_.PhoneInputCountrySelect]:!cursor-pointer [&_.PhoneInputCountrySelect]:!z-[1]",
        "[&_.PhoneInputCountrySelectArrow]:opacity-50 [&_.PhoneInputCountrySelectArrow]:ml-1",
        "[&_input::placeholder]:!text-gray-400 [&_input::placeholder]:!opacity-100",
        error
          ? "border-red-500 focus-within:ring-red-500"
          : "border-input focus-within:ring-ring"
      )}
    />
  );
}
