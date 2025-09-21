import Form from "./Form";

export const metadata = {
  title: "Связаться с нами — Kmotors",
  description:
    "Оставьте заявку на подбор автомобиля из Южной Кореи. Мы свяжемся с вами удобным способом: Telegram, WhatsApp или звонок.",
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">Связаться с нами</h1>
      <p className="mb-6 text-gray-700">
        Хотите узнать больше о корейских автомобилях или получить персональный
        подбор? Заполните форму ниже — мы свяжемся с вами в ближайшее время.
      </p>
      <Form />
    </div>
  );
}
