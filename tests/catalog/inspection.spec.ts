import { describe, expect, it } from "vitest";
import { normalizeInspection } from "@/lib/vehicleInspection";
import { getServerT } from "@/lib/serverT";
import ru from "@/locales/ru/common.json";
import en from "@/locales/en/common.json";
import ka from "@/locales/ka/common.json";
import ar from "@/locales/ar/common.json";

// Фикстуры — урезанные ответы реального api.encar.com (замер 27.11.2026).
const group = (code: string, children: unknown[]) => ({ type: { code, title: "x" }, children });
const leaf = (code: string, status: string | null) => ({
  type: { code, title: "x" },
  statusType: status ? { code: status, title: "x" } : null,
  children: [],
});

const CLEAN = {
  vehicleId: 41301106,
  master: {
    accdient: false,
    simpleRepair: false,
    registrationDate: "2026-01-08T13:09:25",
    detail: {
      issueDate: "20260106",
      mileage: 40922,
      waterlog: false,
      tuning: false,
      recall: false,
      recallFullFillTypes: [],
      seriousTypes: [],
      usageChangeTypes: [],
    },
  },
  inners: [
    group("S00", [leaf("s001", "1"), leaf("s002", "1")]),
    group("S01", [leaf("s003", "1"), group("s0102", [leaf("s004", "3")])]),
    group("S02", [group("s0201", [leaf("s013", "3")])]),
    group("S04", [leaf("s030", "3")]),
  ],
  outers: [],
};

const REPAIRED = {
  master: {
    accdient: true,
    simpleRepair: true,
    detail: {
      issueDate: "20261017",
      waterlog: false,
      tuning: true,
      recall: true,
      recallFullFillTypes: [{ code: "2", title: "미이행" }],
      seriousTypes: [],
    },
  },
  inners: [group("S00", [leaf("s001", "1"), leaf("s002", "10")]), group("S01", [leaf("s007", "8")])],
  outers: [
    { type: { code: "P034", title: "리어 도어(우)" }, statusTypes: [{ code: "X" }], attributes: ["RANK_ONE"] },
    { type: { code: "P062", title: "쿼터 패널(좌)" }, statusTypes: [{ code: "W" }], attributes: ["RANK_TWO"] },
    { type: { code: "P0", title: "필러 패널(중간)(우)" }, statusTypes: [{ code: "X" }], attributes: ["RANK_B"] },
    { type: { code: "P1", title: "후드" }, statusTypes: [{ code: "W" }, { code: "A" }], attributes: [] },
    { type: { code: "P2", title: "незнакомая деталь" }, statusTypes: [{ code: "Q" }], attributes: ["RANK_A"] },
  ],
};

describe("normalizeInspection", () => {
  it("не рисует ничего без листа или с мусором", () => {
    expect(normalizeInspection(null)).toBeNull();
    expect(normalizeInspection("<html/>")).toBeNull();
    expect(normalizeInspection({})).toBeNull();
    expect(normalizeInspection({ master: {} })).toBeNull();
  });

  it("чистый лист: флаги и дата, без вердиктов", () => {
    const v = normalizeInspection(CLEAN)!;
    expect(v.inspectedAt).toBe("2026-01-06");
    expect(v.mileage).toBe(40922);
    expect(v.structural).toBe(false);
    expect(v.simpleRepair).toBe(false);
    expect(v.flood).toBe(false);
    expect(v.fire).toBe(false); // seriousTypes пришёл пустым массивом
    expect(v.recall).toEqual({ exists: false, done: null });
    expect(v.engine).toEqual({ selfCheck: "ok", marks: 0 });
    expect(v.transmission).toEqual({ selfCheck: "ok", marks: 0 });
    expect(v.otherMarks).toBe(0);
    expect(v.panels).toEqual([]);
    expect(v.tuning).toBe(false);
  });

  it("лист с ремонтом: детали, стороны, зоны, статусы", () => {
    const v = normalizeInspection(REPAIRED)!;
    expect(v.structural).toBe(true);
    expect(v.simpleRepair).toBe(true);
    expect(v.panels).toEqual([
      { part: "rearDoor", side: "right", zone: "outer", statuses: ["replaced"] },
      { part: "quarterPanel", side: "left", zone: "outer", statuses: ["repaired"] },
      { part: "pillarMiddle", side: "right", zone: "frame", statuses: ["replaced"] },
      { part: "hood", side: null, zone: "unknown", statuses: ["repaired", "scratch"] },
      { part: "other", side: null, zone: "frame", statuses: ["other"] },
    ]);
  });

  it("двигатель и КПП: самодиагностика и счётчик замечаний", () => {
    const v = normalizeInspection(REPAIRED)!;
    expect(v.engine).toEqual({ selfCheck: "ok", marks: 1 }); // нехватка масла (код 8)
    expect(v.transmission).toEqual({ selfCheck: "issue", marks: 0 }); // код 10
  });

  it("отзывная кампания: не выполнена / выполнена / статус не указан", () => {
    expect(normalizeInspection(REPAIRED)!.recall).toEqual({ exists: true, done: false });
    const done = { master: { accdient: false, detail: { recall: true, recallFullFillTypes: [{ code: "1" }] } } };
    expect(normalizeInspection(done)!.recall).toEqual({ exists: true, done: true });
    const unknown = { master: { accdient: false, detail: { recall: true, recallFullFillTypes: [] } } };
    expect(normalizeInspection(unknown)!.recall).toEqual({ exists: true, done: null });
  });

  it("затопление и пожар читаются из waterlog и seriousTypes", () => {
    const wet = { master: { accdient: false, detail: { waterlog: true, seriousTypes: [] } } };
    expect(normalizeInspection(wet)!.flood).toBe(true);
    const fire = { master: { accdient: false, detail: { waterlog: false, seriousTypes: [{ title: "화재" }] } } };
    const v = normalizeInspection(fire)!;
    expect(v.fire).toBe(true);
    expect(v.flood).toBe(false);
  });

  it("нет данных — null, а не «нет»: пожар без seriousTypes неизвестен", () => {
    const v = normalizeInspection({ master: { accdient: false, detail: {} } })!;
    expect(v.fire).toBeNull();
    expect(v.flood).toBeNull();
    expect(v.recall).toBeNull();
    expect(v.engine).toBeNull();
  });

  it("дата: запасной вариант — дата записи на Encar", () => {
    const v = normalizeInspection({ master: { accdient: false, registrationDate: "2026-01-08T13:09:25", detail: {} } })!;
    expect(v.inspectedAt).toBe("2026-01-08");
  });
});

describe("словарь car.inspection / car.trust", () => {
  const dicts = { ru, en, ka, ar } as Record<string, { car: Record<string, unknown> }>;
  const flat = (o: unknown, prefix = ""): string[] =>
    o && typeof o === "object"
      ? Object.entries(o).flatMap(([k, v]) => flat(v, `${prefix}${k}.`))
      : [prefix.slice(0, -1)];

  it("во всех четырёх языках одинаковый набор ключей", () => {
    for (const ns of ["inspection", "trust"]) {
      const base = flat(dicts.en.car[ns]).sort();
      expect(base.length).toBeGreaterThan(3); // trust — 4 ключа: отзывы убраны с карточки
      for (const lang of ["ru", "ka", "ar"]) {
        expect(flat(dicts[lang].car[ns]).sort(), `${lang}.${ns}`).toEqual(base);
      }
    }
  });

  it("ключи находятся в ru/ka/ar и нет хангыля", () => {
    for (const lang of ["ru", "ka", "ar"]) {
      const t = getServerT(lang);
      for (const key of flat(dicts.en.car.inspection)) {
        const full = `car.inspection.${key}`;
        expect(t(full)).not.toBe(full);
        expect(t(full)).not.toMatch(/[ㄱ-힝]/);
      }
    }
  });

  it("getServerT: подстановка, фолбэк на en и на сам ключ", () => {
    expect(getServerT("ru")("car.inspection.mileageValue", { km: "40 922" })).toBe("40 922 км");
    expect(getServerT("ko")("car.inspection.title")).toBe("Осмотр Encar"); // ko → ru по умолчанию
    expect(getServerT("ru")("car.inspection.нет.такого")).toBe("car.inspection.нет.такого");
  });

  it("шаги «Как мы работаем» берут существующие ключи /buy", () => {
    for (const lang of ["ru", "en", "ka", "ar"]) {
      const t = getServerT(lang);
      for (const n of [2, 3, 4, 6]) expect(t(`buy.steps.step${n}.title`)).not.toContain("buy.steps");
      expect(t("buy.steps.step2.description")).toMatch(/2[\s, ]?000[\s, ]?000/);
    }
  });
});
