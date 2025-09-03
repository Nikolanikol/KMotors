import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const Stage = () => {
  return (
    <div className="pt-5 pb-20 bg-[#f5f5f5]  ">
      <div className=" container mx-auto">
        <h2 className="heading-2 text-center">Этапы покупки</h2>
        <div className="row  overflow-x-scroll px-5 flex gap-x-3 mt-10">
          <Item
            title="Записаться на бесплатную консультацию"
            desc={[
              "— Мы подробно обсудим ваши пожелания и бюджет",
              "— Поможем определиться с моделью",
              "— Ответим на все вопросы и объясним процесс без сложных терминов",
            ]}
          />
          <Item
            title="Подписание договора"
            desc={[
              "— Заключаем официальный договор, который закрепляет наши обязательства*",
              "— Удобная и прозрачная система оплаты без комиссий и неожиданных платежей*",
              "*Оплата производится официально по расчётному счёту",
            ]}
          />
          <Item
            title="Поиск и покупка авто
"
            desc={[
              "— Наши специалисты подбирают лучший вариант через проверенные зарубежные аукционы и продавцов",
              "— Предоставляем фото и видеоотчёты*",
              "*Если не подбирается нужное авто — возвращаем деньги",
            ]}
          />
          <Item
            title="Доставка и таможенное оформление
"
            desc={[
              "— Доставка от 15 дней напрямую через официальную таможню РФ",
              "— Полное оформление всех необходимых документов (СБКТС, ЭПТС, ТПО)",
              "— Страхование на всех этапах перевозки",
            ]}
          />{" "}
          <Item
            title="Передача автомобиля

"
            desc={[
              "— Вы получаете свой автомобиль в одном из пунктов выдачи по России ",
              "— Машина полностью готова к постановке на учёт",
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default Stage;

interface ItemProps {
  title: string;
  desc: string[];
}
const Item = ({ title, desc }: ItemProps) => {
  return (
    <Card className="item border-[color:#eb6753]  border-2 py-2 px-2 rounded-2xl max-w-[300px]">
      <CardHeader>
        <CardTitle>
          {" "}
          <h3 className="heading-3">{title}</h3>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {desc.map((string, i) => (
            <li key={i}> {string}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
