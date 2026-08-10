/**
 * Общие типы ядра. Ядро не знает про DOM, React, сеть и текущую дату:
 * всё, что нужно расчёту, приходит во входном объекте.
 */

export interface Money {
  amount: number;
  currency: string;
}

/** Строка чека. */
export interface Line {
  id: string;
  label: string;
  /** Пояснение под строкой — формула, основание, ставка. */
  note?: string;
  amount: number;
  currency: string;
  /** Строка есть, но платежа нет — рисуется приглушённо. */
  muted?: boolean;
}

export type FlagLevel = "info" | "warn" | "critical";

export interface Flag {
  level: FlagLevel;
  text: string;
}

export interface CalcResult {
  lines: Line[];
  /**
   * Строки под итогом, которые в итог НЕ входят: платежи, связанные с авто,
   * но не с ввозом. Появились из-за Албании — там ежегодный налог на роскошь
   * взимается, пока машина на учёте, и складывать его с растаможкой нельзя.
   *
   * Прятать такое во флаг неправильно: это деньги, а не примечание.
   */
  extra?: Line[];
  total: Money;
  /** Итог в других валютах — справочно. */
  alt: Money[];
  flags: Flag[];
  /** Категория, бракет, возраст — для бейджей в интерфейсе. */
  meta: Record<string, string>;
}

export interface SelectOption {
  value: string;
  label: string;
}

/** Декларативное описание поля формы. Один рендерер обслуживает все страны. */
/**
 * Валютная пара, значение которой подставляется в поле формы.
 *
 * Ядро при этом остаётся чистым: оно объявляет, *какой* курс нужен полю,
 * но само никуда не ходит и получает уже готовое число во входном объекте.
 * Достаёт курс слой `fx/`, подставляет интерфейс.
 */
export interface RatePair {
  from: string;
  to: string;
}

export type FieldDef =
  | {
      kind: "number";
      id: string;
      label: string;
      hint?: string;
      min?: number;
      max?: number;
      step?: number;
      /** Поле показывается, только если предикат вернул true. */
      visibleIf?: (input: Record<string, unknown>) => boolean;
      /**
       * Значение поля — курс. Пара может зависеть от других полей формы:
       * у Албании валюта сделки переключается, и курс обязан ехать за ней.
       * Поле при этом остаётся редактируемым — курс лишь подставляется.
       */
      ratePair?: (input: Record<string, unknown>) => RatePair;
    }
  | {
      kind: "segmented";
      id: string;
      label: string;
      hint?: string;
      options: SelectOption[];
      visibleIf?: (input: Record<string, unknown>) => boolean;
    }
  | {
      kind: "select";
      id: string;
      label: string;
      hint?: string;
      options: SelectOption[];
      visibleIf?: (input: Record<string, unknown>) => boolean;
    }
  | {
      kind: "switch";
      id: string;
      label: string;
      hint?: string;
      visibleIf?: (input: Record<string, unknown>) => boolean;
    };

export interface CountryCalculator<TInput> {
  id: string;
  title: string;
  fields: FieldDef[];
  defaults: TInput;
  calculate(input: TInput): CalcResult;
}
