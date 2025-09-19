import "../lib/118n";
import { TFunction } from "i18next";
export const translateGenerationRow = (string: string, t: TFunction) => {
  if (string) {
    const arr = string.split(" ");
    const result = arr.map((value) => t(value)).join(" ");

    return result;
  }
};
