import Brands from "@/components/Home/Brands/Brands";
import CarSlider from "@/components/Home/CarSlider/CarSlider";
import Main from "@/components/Home/Main";

export default function Home() {
  return (
    <div className="  min-h-[70vh]">
      <Main />
      <div className="py-20 rounded-[50px] md:rounded-[100px] mt-[-100px] relative z-10 bg-white  overflow-hidden">
        <CarSlider
          reqString="https://encar-proxy-main.onrender.com/api/catalog?count=true&q=(And.Hidden.N._.SellType.%EC%9D%BC%EB%B0%98._.(C.CarType.A._.Manufacturer.%EA%B8%B0%EC%95%84.))&sr=%7CModifiedDate%7C0%7C20"
          title="Kia"
        />
        <CarSlider
          reqString="https://encar-proxy-main.onrender.com/api/catalog?count=true&q=(And.Hidden.N._.SellType.%EC%9D%BC%EB%B0%98._.(C.CarType.A._.Manufacturer.%ED%98%84%EB%8C%80.))&sr=%7CModifiedDate%7C0%7C20
"
          title="Hyundai"
        />
      </div>
      <Brands />
      {/* <Stage /> */}
    </div>
  );
}
