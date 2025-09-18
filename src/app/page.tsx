import Brands from "@/components/Home/Brands";
import CarSlider from "@/components/Home/CarSlider/CarSlider";
import Main from "@/components/Home/Main";
import Stage from "@/components/Home/Stage";

export default function Home() {
  return (
    <div className="  min-h-[70vh]">
      <Main />
      <Stage />
      <CarSlider />
      <Brands />
    </div>
  );
}
