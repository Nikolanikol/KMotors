import React from "react";

const Stage = () => {
  const steps = [
    {
      num: "01",
      title: "Записаться на бесплатную консультацию",
      desc: ["Обсудим ваши пожелания и бюджет", "Поможем определиться с моделью", "Ответим на все вопросы без сложных терминов"],
    },
    {
      num: "02",
      title: "Подписание договора",
      desc: ["Официальный договор с фиксацией обязательств", "Прозрачная система оплаты без скрытых комиссий", "Оплата официально по расчётному счёту"],
    },
    {
      num: "03",
      title: "Поиск и покупка авто",
      desc: ["Подбор через проверенные аукционы Encar, KCar", "Фото и видеоотчёты о состоянии авто", "Если не подобрали — возвращаем деньги"],
    },
    {
      num: "04",
      title: "Доставка и таможенное оформление",
      desc: ["Доставка от 15 дней через официальную таможню", "Полное оформление документов (СБКТС, ЭПТС, ТПО)", "Страхование на всех этапах перевозки"],
    },
    {
      num: "05",
      title: "Передача автомобиля",
      desc: ["Получение в пункте выдачи по России", "Машина готова к постановке на учёт"],
    },
  ];

  return (
    <section className="py-24" style={{ backgroundColor: "var(--axis-black)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="font-heading text-3xl md:text-4xl text-center mb-16" style={{ color: "var(--axis-white)" }}>
          Этапы покупки
        </h2>
        <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-4">
          {steps.map((step) => (
            <div
              key={step.num}
              className="flex-shrink-0 w-[280px] rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 group"
              style={{
                backgroundColor: "var(--axis-charcoal)",
                border: "1px solid rgba(255,69,0,0.2)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,69,0,0.5)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 40px rgba(255,69,0,0.1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,69,0,0.2)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              <div className="text-4xl font-bold mb-4 opacity-30" style={{ color: "var(--axis-orange)" }}>
                {step.num}
              </div>
              <h3 className="text-base font-semibold mb-4 leading-snug" style={{ color: "var(--axis-white)" }}>
                {step.title}
              </h3>
              <ul className="space-y-2">
                {step.desc.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--axis-gray)" }}>
                    <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--axis-orange)" }} />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stage;
