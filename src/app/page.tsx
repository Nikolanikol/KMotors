import Brands from "@/components/Home/Brands";
import Main from "@/components/Home/Main";
import Stage from "@/components/Home/Stage";

export default function Home() {
  return (
    <div className="  min-h-[70vh]">
      <Main />
      <Stage />
      <Brands />
    </div>
  );
}
