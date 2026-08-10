/**
 * Общие типы ядра. Ядро не знает про DOM, React, сеть и текущую дату:
 * всё, что нужно расчёту, приходит во входном объекте.
 */

export interface Money {
  amount: number;
  currency: string;
}

/**
 * Локализуемый текст: ключ перевода плюс параметры подстановки.
 *
 * Ядро остаётся чистым и языка не знает — оно называет текст и передаёт
 * числа, из которых текст собирается. Строку выбирает интерфейс через i18next,
 * неймспейс `customs`. Так одно ядро обслуживает все четыре локали, а числа
 * в формулировке приходят из таблиц ставок, а не дублируются в переводах.
 */
export interface I18nText {
  key: string;
  /**
   * Параметр сам может быть локализуемым текстом — например возрастной бракет
   * внутри формулы акциза. Интерфейс разворачивает вложения рекурсивно.
   * Без этого пришлось бы заводить отдельный ключ на каждое сочетание, и
   * набор ключей рос бы произведением вариантов, а не суммой.
   */
  params?: Record<string, string | number | I18nText>;
}

/** Строка чека. */
export interface Line {
  id: string;
  label: I18nText;
  /** Пояснение под строкой — формула, основание, ставка. */
  note?: I18nText;
  amount: number;
  currency: string;
  /** Строка есть, но платежа нет — рисуется приглушённо. */
  muted?: boolean;
}

export type FlagLevel = "info" | "warn" | "critical";

export interface Flag {
  level: FlagLevel;
  text: I18nText;
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
  /**
   * Параметры расчёта под заголовком чека. Собирает ядро, чтобы интерфейс
   * не обвешивался условиями по странам; склеивает интерфейс через « · ».
   */
  subtitle: I18nText[];
  /** Надпись на печати чека — бракет, режим расчёта. */
  stampLabel: I18nText;
  /**
   * МАШИННЫЕ значения: промежуточные суммы, коды бракетов, возраст.
   * Показывать их как есть нельзя — они не переводятся. Всё, что видит
   * посетитель, идёт через `I18nText`.
   */
  meta: Record<string, string>;
}

export interface SelectOption {
  value: string;
  label: I18nText;
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
      label: I18nText;
      hint?: I18nText;
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
      label: I18nText;
      hint?: I18nText;
      options: SelectOption[];
      visibleIf?: (input: Record<string, unknown>) => boolean;
    }
  | {
      kind: "select";
      id: string;
      label: I18nText;
      hint?: I18nText;
      options: SelectOption[];
      visibleIf?: (input: Record<string, unknown>) => boolean;
    }
  | {
      kind: "switch";
      id: string;
      label: I18nText;
      hint?: I18nText;
      visibleIf?: (input: Record<string, unknown>) => boolean;
    };

export interface CountryCalculator<TInput> {
  id: string;
  title: I18nText;
  fields: FieldDef[];
  defaults: TInput;
  calculate(input: TInput): CalcResult;
}
