interface FilterData {
  Action: string;
  DisplayValue: string;
}

export const data: FilterData[] = [
  {
    Action: "(And.Hidden.N._.(C.CarType.Y._.Manufacturer.현대.))",
    DisplayValue: "현대",
    // и так далее для каждого свойства
  },
  {
    Action: "(And.Hidden.N._.(C.CarType.Y._.Manufacturer.제네시스.))",
    DisplayValue: "제네시스",
    // и так далее для каждого свойства
  },
  {
    Action: "(And.Hidden.N._.(C.CarType.Y._.Manufacturer.기아.))",
    DisplayValue: "기아",
  },
  {
    Action: "(And.Hidden.N._.(C.CarType.Y._.Manufacturer.쉐보레(GM대우_).))",
    DisplayValue: "쉐보레(GM대우)",
  },
  {
    Action: "(And.Hidden.N._.(C.CarType.Y._.Manufacturer.르노코리아(삼성_).))",
    DisplayValue: "르노코리아(삼성)",
  },
  {
    Action: "(And.Hidden.N._.(C.CarType.Y._.Manufacturer.KG모빌리티(쌍용_).))",
    DisplayValue: "KG모빌리티(쌍용)",
  },
  {
    Action: "(And.Hidden.N._.(C.CarType.N._.Manufacturer.BMW.))",
    DisplayValue: "BMW",
  },
  {
    Action: "(And.Hidden.N._.(C.CarType.N._.Manufacturer.랜드로버.))",
    DisplayValue: "랜드로버",
  },
  {
    Action: "(And.Hidden.N._.(C.CarType.N._.Manufacturer.렉서스.))",
    DisplayValue: "렉서스",
  },
  {
    Action: "(And.Hidden.N._.(C.CarType.N._.Manufacturer.마세라티.))",
    DisplayValue: "마세라티",
  },
  {
    Action: "(And.Hidden.N._.(C.CarType.N._.Manufacturer.미니.))",
    DisplayValue: "미니",
  },
  {
    Action: "(And.Hidden.N._.(C.CarType.N._.Manufacturer.벤츠.))",
    DisplayValue: "벤츠",
  },
  {
    Action: "(And.Hidden.N._.(C.CarType.N._.Manufacturer.볼보.))",
    DisplayValue: "볼보",
  },
  {
    Action: "(And.Hidden.N._.(C.CarType.N._.Manufacturer.아우디.))",
    DisplayValue: "아우디",
  },
  {
    Action: "(And.Hidden.N._.(C.CarType.N._.Manufacturer.지프.))",
    DisplayValue: "지프",
  },
  {
    Action: "(And.Hidden.N._.(C.CarType.N._.Manufacturer.테슬라.))",
    DisplayValue: "테슬라",
  },
  {
    Action: "(And.Hidden.N._.(C.CarType.N._.Manufacturer.포드.))",
    DisplayValue: "포드",
  },
  {
    Action: "(And.Hidden.N._.(C.CarType.N._.Manufacturer.포르쉐.))",
    DisplayValue: "포르쉐",
  },
  {
    Action: "(And.Hidden.N._.(C.CarType.N._.Manufacturer.폭스바겐.))",
    DisplayValue: "폭스바겐",
  },

  // и так далее для каждого объекта в массиве
];
