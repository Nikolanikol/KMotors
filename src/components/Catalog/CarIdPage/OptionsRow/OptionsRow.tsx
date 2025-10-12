import React, { FC } from "react";

import { catalog } from "./data";
import { FaCheck } from "react-icons/fa";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
interface OptionsRowProps {
  data: {
    choice: string[];
    standard: string[];
  };
}

const OptionsRow: FC<OptionsRowProps> = ({ data }) => {
  return (
    <div>
      {/* <div>
        choice
        {data.choice.map((item) => (
          <p>{item}</p>
        ))}
      </div> */}
      <div>
        <div className="shadow-2xl rounded-2xl  px-8 py-5">
          <h2 className="heading-3">Характеристики автомобиля</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 py-8">
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger>Опции</AccordionTrigger>
                {data.standard.map((item) => {
                  return catalog.map((i) => {
                    if (item == i.code) {
                      return (
                        <AccordionContent
                          key={i.code}
                          className="flex justify-between gap-5 max-w-[400px]"
                        >
                          <span>{i.translatedValue}</span> <FaCheck />
                        </AccordionContent>
                      );
                    }
                  });
                })}
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionsRow;

// 1051 белая кожа
// 1057 8 люймов дисплей
