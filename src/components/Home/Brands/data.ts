import kia from "./logo/kia.webp";
import audi from "./logo/audi.webp";
import bmw from "./logo/bmw.webp";
import chevrolet from "./logo/chevrolet.webp";
import hyundai from "./logo/hyundai.webp";
import mercedesBenz from "./logo/mercedes-benz.webp";
import porsche from "./logo/porsche.webp";
import ssangyong from "./logo/ssangyong.webp";
import renaultSamsung from "./logo/renault-samsung.webp";
import { StaticImageData } from "next/image";
export const logoArray: { logo: StaticImageData; name: string; action: string }[] = [
    {
      logo: kia,
      name: "Kia",
      action: "(And.Hidden.N._.(C.CarType.Y._.Manufacturer.기아.))",
    },
    {
      logo: audi,
      name: "Audi",
      action: "(And.Hidden.N._.(C.CarType.N._.Manufacturer.아우디.))",
    },
    {
      logo: bmw,
      name: "BMW",
      action: "(And.Hidden.N._.(C.CarType.N._.Manufacturer.BMW.))",
    },
    {
      logo: chevrolet,
      name: "Chevrolet",
      action: "(And.Hidden.N._.(C.CarType.Y._.Manufacturer.쉐보레(GM대우_).))",
    },
    {
      logo: hyundai,
      name: "Hyundai",
      action: "(And.Hidden.N._.(C.CarType.Y._.Manufacturer.현대.))",
    },
    {
      logo: mercedesBenz,
      name: "Mercedes-Benz",
      action: "(And.Hidden.N._.(C.CarType.N._.Manufacturer.벤츠.))",
    },
    {
      logo: porsche,
      name: "Porsche",
      action: "(And.Hidden.N._.(C.CarType.N._.Manufacturer.포르쉐.)) ",
    },
    {
      logo: ssangyong,
      name: "SsangYong",
      action:
        "(And.Hidden.N._.(C.CarType.Y._.Manufacturer.KG모빌리티(쌍용_).))",
    },
    {
      logo: renaultSamsung,
      name: "Renault Samsung",
      action:
        "(And.Hidden.N._.(C.CarType.Y._.Manufacturer.르노코리아(삼성_).))",
    },
  ];