import type { Metadata } from "next";
import { makeAlternates } from "@/lib/seo";

const TERMS_META: Record<string, { title: string; description: string }> = {
  ru: {
    title: "Пользовательское соглашение",
    description: "Публичная оферта интернет-магазина Axis — условия покупки автозапчастей из Южной Кореи.",
  },
  en: {
    title: "Terms of Service",
    description: "Axis online store public offer — terms and conditions for purchasing auto parts from South Korea.",
  },
  ko: {
    title: "이용약관",
    description: "Axis 온라인 스토어 공개 청약 — 한국산 자동차 부품 구매 약관.",
  },
  ka: {
    title: "მომხმარებლის შეთანხმება",
    description: "Axis ონლაინ მაღაზიის საჯარო შეთავაზება — სამხრეთ კორეიდან ავტონაწილების შეძენის პირობები.",
  },
  ar: {
    title: "اتفاقية المستخدم",
    description: "العرض العام لمتجر Axis — شروط وأحكام شراء قطع غيار السيارات من كوريا الجنوبية.",
  },
};

const TERMS_CONTENT: Record<string, {
  lastUpdated: string;
  sections: { title: string; text: string }[];
}> = {
  ru: {
    lastUpdated: "15 июня 2026 г.",
    sections: [
      {
        title: "1. Общие положения",
        text: "Настоящее Пользовательское соглашение (далее — «Оферта») является официальным предложением компании Axis (далее — «Продавец»), адресованным любому лицу (далее — «Покупатель»), заключить договор купли-продажи автозапчастей на условиях, изложенных ниже. Оферта размещена на сайте www.kmotors.shop. Оформление заказа на сайте является безусловным принятием условий настоящей Оферты.",
      },
      {
        title: "2. Предмет соглашения",
        text: "Продавец реализует оригинальные и совместимые автозапчасти для автомобилей корейского производства (Hyundai, Kia, Genesis, SsangYong и др.) через интернет-магазин www.kmotors.shop. Каталог товаров, описания, цены и наличие размещены на сайте и могут обновляться без предварительного уведомления.",
      },
      {
        title: "3. Оформление заказа",
        text: "Покупатель оформляет заказ через сайт, добавляя товары в корзину и завершая оформление. Заказ считается принятым после получения подтверждения по электронной почте. Продавец оставляет за собой право отклонить заказ при отсутствии товара на складе или невозможности его доставки в страну Покупателя, с полным возвратом оплаты.",
      },
      {
        title: "4. Цены и оплата",
        text: "Все цены на сайте указаны в долларах США (USD) и включают стоимость товара без учёта доставки. Стоимость доставки рассчитывается отдельно и отображается при оформлении заказа. Оплата осуществляется через PayPal. Продавец оставляет за собой право добавлять дополнительные способы оплаты. Цены могут изменяться в зависимости от курса корейской воны (KRW) к доллару США.",
      },
      {
        title: "5. Доставка",
        text: "Доставка осуществляется международной почтовой службой EMS Korea в страны, поддерживаемые данной службой. Сроки доставки зависят от страны назначения и составляют от 5 до 20 рабочих дней. Продавец не несёт ответственности за задержки, вызванные таможенными процедурами, действиями почтовых служб или обстоятельствами непреодолимой силы. Покупатель несёт ответственность за уплату таможенных пошлин и налогов в своей стране.",
      },
      {
        title: "6. Возврат и обмен",
        text: "В связи со спецификой международной доставки автозапчастей из Южной Кореи возврат товара надлежащего качества не предусмотрен. Покупатель обязан тщательно сверить артикул, наименование и совместимость запчасти (в том числе по VIN-номеру) до оформления заказа. В случае получения товара ненадлежащего качества (заводской брак, несоответствие заказанному артикулу по вине Продавца) вопрос решается индивидуально: замена или возврат денежных средств. Для обращения по таким случаям свяжитесь с нами по адресу koreamotorsshop@gmail.com.",
      },
      {
        title: "7. Гарантии и ответственность",
        text: "Продавец гарантирует соответствие товара описанию на сайте. Гарантия не распространяется на повреждения, возникшие в результате неправильной установки, эксплуатации или естественного износа. Продавец не несёт ответственности за совместимость запчасти с конкретным автомобилем, если Покупатель не уточнил VIN-номер при заказе.",
      },
      {
        title: "8. Персональные данные",
        text: "Продавец собирает и обрабатывает персональные данные Покупателя (имя, телефон, адрес доставки, email) исключительно для выполнения заказа и в соответствии с Политикой конфиденциальности, размещённой на сайте. Данные не передаются третьим лицам, кроме служб доставки в объёме, необходимом для отправки посылки.",
      },
      {
        title: "9. Разрешение споров",
        text: "Все споры и разногласия решаются путём переговоров. При невозможности достижения соглашения спор подлежит рассмотрению в соответствии с законодательством Республики Корея. Для связи по вопросам и претензиям: koreamotorsshop@gmail.com.",
      },
      {
        title: "10. Заключительные положения",
        text: "Настоящая Оферта вступает в силу с момента её размещения на сайте и действует бессрочно. Продавец оставляет за собой право вносить изменения в условия Оферты. Изменения вступают в силу с момента публикации на сайте. Продолжение использования сайта после внесения изменений означает согласие Покупателя с новыми условиями.",
      },
    ],
  },
  en: {
    lastUpdated: "June 15, 2026",
    sections: [
      {
        title: "1. General provisions",
        text: "This User Agreement (hereinafter — the \"Offer\") is an official proposal of the company Axis (hereinafter — the \"Seller\") addressed to any person (hereinafter — the \"Buyer\") to enter into a purchase agreement for auto parts under the conditions stated below. The Offer is published at www.kmotors.shop. Placing an order on the website constitutes unconditional acceptance of the terms of this Offer.",
      },
      {
        title: "2. Subject of the agreement",
        text: "The Seller offers original and compatible auto parts for Korean-made vehicles (Hyundai, Kia, Genesis, SsangYong, etc.) through the online store www.kmotors.shop. The product catalog, descriptions, prices, and availability are listed on the website and may be updated without prior notice.",
      },
      {
        title: "3. Placing an order",
        text: "The Buyer places an order through the website by adding items to the cart and completing checkout. The order is considered accepted upon receipt of a confirmation email. The Seller reserves the right to decline an order if the item is out of stock or cannot be delivered to the Buyer's country, with a full refund issued.",
      },
      {
        title: "4. Prices and payment",
        text: "All prices on the website are listed in US Dollars (USD) and include the cost of the product, excluding shipping. Shipping costs are calculated separately and displayed at checkout. Payment is processed via PayPal. The Seller reserves the right to add additional payment methods. Prices may change depending on the Korean Won (KRW) to US Dollar exchange rate.",
      },
      {
        title: "5. Shipping",
        text: "Shipping is handled by EMS Korea international postal service to countries supported by the service. Delivery times depend on the destination country and range from 5 to 20 business days. The Seller is not responsible for delays caused by customs procedures, postal services, or force majeure. The Buyer is responsible for paying customs duties and taxes in their country.",
      },
      {
        title: "6. Returns and exchanges",
        text: "Due to the nature of international auto parts shipping from South Korea, returns of products of proper quality are not accepted. The Buyer is responsible for carefully verifying the part number, name, and compatibility (including by VIN number) before placing an order. In the event of receiving a product of improper quality (manufacturing defect, wrong part number shipped due to Seller's error), the issue is resolved on a case-by-case basis: replacement or refund. For such cases, contact us at koreamotorsshop@gmail.com.",
      },
      {
        title: "7. Warranties and liability",
        text: "The Seller guarantees that products match their website descriptions. The warranty does not cover damage resulting from improper installation, use, or natural wear. The Seller is not liable for part compatibility with a specific vehicle if the Buyer did not provide a VIN number when ordering.",
      },
      {
        title: "8. Personal data",
        text: "The Seller collects and processes the Buyer's personal data (name, phone, shipping address, email) solely for order fulfillment and in accordance with the Privacy Policy published on the website. Data is not shared with third parties except delivery services to the extent necessary for shipment.",
      },
      {
        title: "9. Dispute resolution",
        text: "All disputes shall be resolved through negotiation. If an agreement cannot be reached, the dispute shall be settled in accordance with the laws of the Republic of Korea. For inquiries and claims: koreamotorsshop@gmail.com.",
      },
      {
        title: "10. Final provisions",
        text: "This Offer takes effect from the moment of its publication on the website and is valid indefinitely. The Seller reserves the right to amend the terms of the Offer. Amendments take effect upon publication on the website. Continued use of the website after amendments constitutes the Buyer's acceptance of the new terms.",
      },
    ],
  },
  ko: {
    lastUpdated: "2026년 6월 15일",
    sections: [
      {
        title: "1. 총칙",
        text: "본 이용약관(이하 \"청약\")은 Axis(이하 \"판매자\")가 모든 개인(이하 \"구매자\")에게 아래 명시된 조건에 따라 자동차 부품 매매 계약을 체결할 것을 제안하는 공식 제안서입니다. 청약은 www.kmotors.shop에 게시됩니다. 웹사이트에서 주문하는 것은 본 청약의 조건에 대한 무조건적인 동의를 의미합니다.",
      },
      {
        title: "2. 계약의 대상",
        text: "판매자는 온라인 스토어 www.kmotors.shop을 통해 한국산 차량(현대, 기아, 제네시스, 쌍용 등)의 정품 및 호환 자동차 부품을 판매합니다. 제품 카탈로그, 설명, 가격 및 재고는 사전 통지 없이 업데이트될 수 있습니다.",
      },
      {
        title: "3. 주문 접수",
        text: "구매자는 장바구니에 상품을 추가하고 결제를 완료하여 웹사이트를 통해 주문합니다. 주문은 확인 이메일을 수신한 후 접수된 것으로 간주됩니다. 재고 부족이나 구매자의 국가로 배송이 불가능한 경우 판매자는 전액 환불과 함께 주문을 거부할 권리가 있습니다.",
      },
      {
        title: "4. 가격 및 결제",
        text: "웹사이트의 모든 가격은 미국 달러(USD)로 표시되며 배송비를 제외한 상품 가격입니다. 배송비는 별도로 계산되며 결제 시 표시됩니다. 결제는 PayPal을 통해 처리됩니다. 판매자는 추가 결제 수단을 추가할 권리가 있습니다. 가격은 원화(KRW) 대 미국 달러 환율에 따라 변동될 수 있습니다.",
      },
      {
        title: "5. 배송",
        text: "배송은 EMS Korea 국제 우편 서비스를 통해 해당 서비스가 지원하는 국가로 처리됩니다. 배송 기간은 목적지 국가에 따라 5~20 영업일이 소요됩니다. 판매자는 세관 절차, 우편 서비스 또는 불가항력으로 인한 지연에 대해 책임지지 않습니다. 구매자는 자국의 관세 및 세금을 부담합니다.",
      },
      {
        title: "6. 반품 및 교환",
        text: "한국에서의 국제 자동차 부품 배송 특성상 정상 품질 제품의 반품은 불가합니다. 구매자는 주문 전 부품 번호, 명칭 및 호환성(VIN 번호 포함)을 신중하게 확인해야 합니다. 불량품(제조 결함, 판매자 과실로 인한 잘못된 부품 번호 발송)을 수령한 경우 개별적으로 교환 또는 환불로 해결합니다. 해당 문의: koreamotorsshop@gmail.com.",
      },
      {
        title: "7. 보증 및 책임",
        text: "판매자는 제품이 웹사이트 설명과 일치함을 보증합니다. 보증은 부적절한 설치, 사용 또는 자연 마모로 인한 손상에는 적용되지 않습니다. 구매자가 주문 시 VIN 번호를 제공하지 않은 경우 특정 차량과의 호환성에 대해 판매자는 책임지지 않습니다.",
      },
      {
        title: "8. 개인정보",
        text: "판매자는 주문 이행을 위해서만 구매자의 개인정보(이름, 전화번호, 배송 주소, 이메일)를 수집 및 처리하며, 웹사이트에 게시된 개인정보 처리방침에 따릅니다. 배송에 필요한 범위를 제외하고 제3자에게 데이터를 공유하지 않습니다.",
      },
      {
        title: "9. 분쟁 해결",
        text: "모든 분쟁은 협상을 통해 해결합니다. 합의에 이르지 못할 경우 대한민국 법률에 따라 해결됩니다. 문의 및 클레임: koreamotorsshop@gmail.com.",
      },
      {
        title: "10. 최종 조항",
        text: "본 청약은 웹사이트에 게시된 시점부터 효력이 발생하며 무기한 유효합니다. 판매자는 청약 조건을 변경할 권리가 있습니다. 변경 사항은 웹사이트에 게시된 시점부터 효력이 발생합니다. 변경 후 웹사이트를 계속 사용하면 구매자가 새 조건에 동의한 것으로 간주됩니다.",
      },
    ],
  },
  ka: {
    lastUpdated: "15 ივნისი, 2026",
    sections: [
      {
        title: "1. ზოგადი დებულებები",
        text: "წინამდებარე მომხმარებლის შეთანხმება (შემდგომ — \"შეთავაზება\") წარმოადგენს კომპანია Axis-ის (შემდგომ — \"გამყიდველი\") ოფიციალურ წინადადებას ნებისმიერი პირისთვის (შემდგომ — \"მყიდველი\") ქვემოთ მითითებული პირობებით ავტონაწილების ყიდვა-გაყიდვის ხელშეკრულების გაფორმების შესახებ. შეთავაზება განთავსებულია www.kmotors.shop-ზე. ვებსაიტზე შეკვეთის განთავსება წარმოადგენს წინამდებარე შეთავაზების პირობების უპირობო მიღებას.",
      },
      {
        title: "2. შეთანხმების საგანი",
        text: "გამყიდველი ახორციელებს ორიგინალური და თავსებადი ავტონაწილების რეალიზაციას კორეული წარმოების ავტომობილებისთვის (Hyundai, Kia, Genesis, SsangYong და სხვ.) ონლაინ მაღაზია www.kmotors.shop-ის მეშვეობით.",
      },
      {
        title: "3. შეკვეთის გაფორმება",
        text: "მყიდველი აფორმებს შეკვეთას ვებსაიტის საშუალებით, საქონლის კალათაში დამატებით და შეკვეთის დასრულებით. შეკვეთა მიღებულად ითვლება ელ-ფოსტით დადასტურების მიღების შემდეგ.",
      },
      {
        title: "4. ფასები და გადახდა",
        text: "ვებსაიტზე ყველა ფასი მითითებულია აშშ დოლარში (USD) და მოიცავს საქონლის ღირებულებას მიტანის გარეშე. მიტანის ღირებულება ცალკე გამოითვლება. გადახდა ხორციელდება PayPal-ით.",
      },
      {
        title: "5. მიტანა",
        text: "მიტანა ხორციელდება EMS Korea საერთაშორისო საფოსტო სერვისით. მიტანის ვადა დამოკიდებულია დანიშნულების ქვეყანაზე და შეადგენს 5-დან 20 სამუშაო დღემდე. მყიდველი პასუხისმგებელია საბაჟო გადასახადებზე.",
      },
      {
        title: "6. დაბრუნება და გაცვლა",
        text: "სამხრეთ კორეიდან ავტონაწილების საერთაშორისო მიწოდების სპეციფიკიდან გამომდინარე, ჯეროვანი ხარისხის საქონლის დაბრუნება არ არის გათვალისწინებული. მყიდველი ვალდებულია შეკვეთის გაფორმებამდე ყურადღებით შეამოწმოს ნაწილის ნომერი, დასახელება და თავსებადობა (VIN ნომრის ჩათვლით). უხარისხო საქონლის მიღების შემთხვევაში (ქარხნული წუნი, გამყიდველის ბრალით არასწორი ნაწილის გაგზავნა) საკითხი წყდება ინდივიდუალურად: შეცვლა ან თანხის დაბრუნება. დაგვიკავშირდით: koreamotorsshop@gmail.com.",
      },
      {
        title: "7. გარანტიები და პასუხისმგებლობა",
        text: "გამყიდველი იძლევა გარანტიას, რომ საქონელი შეესაბამება ვებსაიტზე მოცემულ აღწერას. გარანტია არ ვრცელდება არასწორი მონტაჟის, ექსპლუატაციის ან ბუნებრივი ცვეთის შედეგად მიყენებულ დაზიანებებზე.",
      },
      {
        title: "8. პერსონალური მონაცემები",
        text: "გამყიდველი აგროვებს და ამუშავებს მყიდველის პერსონალურ მონაცემებს მხოლოდ შეკვეთის შესრულებისთვის, კონფიდენციალურობის პოლიტიკის შესაბამისად.",
      },
      {
        title: "9. დავების გადაწყვეტა",
        text: "ყველა დავა წყდება მოლაპარაკების გზით. შეთანხმების მიუღწევლობის შემთხვევაში დავა განიხილება კორეის რესპუბლიკის კანონმდებლობის შესაბამისად. კონტაქტი: koreamotorsshop@gmail.com.",
      },
      {
        title: "10. დასკვნითი დებულებები",
        text: "წინამდებარე შეთავაზება ძალაში შედის ვებსაიტზე განთავსების მომენტიდან და მოქმედებს უვადოდ. გამყიდველი იტოვებს უფლებას შეიტანოს ცვლილებები.",
      },
    ],
  },
  ar: {
    lastUpdated: "15 يونيو 2026",
    sections: [
      {
        title: "1. أحكام عامة",
        text: "تُعدّ اتفاقية المستخدم هذه (المشار إليها فيما بعد بـ \"العرض\") عرضاً رسمياً من شركة Axis (المشار إليها فيما بعد بـ \"البائع\") موجّهاً إلى أي شخص (المشار إليه فيما بعد بـ \"المشتري\") لإبرام عقد بيع قطع غيار السيارات وفقاً للشروط المبيّنة أدناه. العرض منشور على www.kmotors.shop. يُعتبر تقديم الطلب على الموقع قبولاً غير مشروط لشروط هذا العرض.",
      },
      {
        title: "2. موضوع الاتفاقية",
        text: "يبيع البائع قطع غيار أصلية ومتوافقة للسيارات الكورية الصنع (هيونداي، كيا، جينيسيس، سانغ يونغ وغيرها) عبر المتجر الإلكتروني www.kmotors.shop. قد يتم تحديث الكتالوج والأوصاف والأسعار دون إشعار مسبق.",
      },
      {
        title: "3. تقديم الطلب",
        text: "يقدّم المشتري طلبه عبر الموقع بإضافة المنتجات إلى السلة وإتمام عملية الشراء. يُعتبر الطلب مقبولاً عند استلام رسالة التأكيد عبر البريد الإلكتروني. يحتفظ البائع بالحق في رفض الطلب في حالة عدم توفر المنتج مع استرداد كامل المبلغ.",
      },
      {
        title: "4. الأسعار والدفع",
        text: "جميع الأسعار على الموقع مُدرجة بالدولار الأمريكي (USD) ولا تشمل تكاليف الشحن. تُحسب تكاليف الشحن بشكل منفصل وتُعرض عند إتمام الطلب. يتم الدفع عبر PayPal. يحتفظ البائع بالحق في إضافة طرق دفع إضافية.",
      },
      {
        title: "5. الشحن",
        text: "يتم الشحن عبر خدمة البريد الدولي EMS Korea إلى الدول المدعومة. تتراوح مدة التوصيل من 5 إلى 20 يوم عمل حسب بلد الوجهة. لا يتحمل البائع مسؤولية التأخيرات الناتجة عن الإجراءات الجمركية. يتحمل المشتري الرسوم الجمركية والضرائب في بلده.",
      },
      {
        title: "6. الإرجاع والاستبدال",
        text: "نظراً لطبيعة الشحن الدولي لقطع غيار السيارات من كوريا الجنوبية، لا يُقبل إرجاع المنتجات ذات الجودة المطابقة. يلتزم المشتري بالتحقق بعناية من رقم القطعة والاسم والتوافق (بما في ذلك رقم VIN) قبل تقديم الطلب. في حالة استلام منتج معيب (عيب تصنيع أو إرسال قطعة خاطئة بسبب خطأ البائع)، يُحل الأمر بشكل فردي: استبدال أو استرداد. للتواصل: koreamotorsshop@gmail.com.",
      },
      {
        title: "7. الضمانات والمسؤولية",
        text: "يضمن البائع مطابقة المنتجات لأوصافها على الموقع. لا يغطي الضمان الأضرار الناتجة عن التركيب الخاطئ أو الاستخدام غير السليم أو التآكل الطبيعي. لا يتحمل البائع مسؤولية التوافق مع مركبة معينة إذا لم يقدم المشتري رقم VIN عند الطلب.",
      },
      {
        title: "8. البيانات الشخصية",
        text: "يجمع البائع البيانات الشخصية للمشتري (الاسم، الهاتف، عنوان الشحن، البريد الإلكتروني) لغرض تنفيذ الطلب فقط وفقاً لسياسة الخصوصية المنشورة على الموقع.",
      },
      {
        title: "9. حل النزاعات",
        text: "تُحل جميع النزاعات عن طريق التفاوض. في حالة عدم التوصل لاتفاق، يُحل النزاع وفقاً لقوانين جمهورية كوريا. للاستفسارات والشكاوى: koreamotorsshop@gmail.com.",
      },
      {
        title: "10. أحكام ختامية",
        text: "يسري هذا العرض من لحظة نشره على الموقع ويظل سارياً لأجل غير مسمى. يحتفظ البائع بالحق في تعديل شروط العرض. تسري التعديلات من لحظة نشرها. استمرار استخدام الموقع بعد التعديلات يعني موافقة المشتري على الشروط الجديدة.",
      },
    ],
  },
};

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const meta = TERMS_META[lang] || TERMS_META.ru;

  return {
    title: meta.title,
    description: meta.description,
    robots: { index: true },
    alternates: makeAlternates(lang, "/terms"),
  };
}

export default async function TermsPage({ params }: Props) {
  const { lang } = await params;
  const content = TERMS_CONTENT[lang] || TERMS_CONTENT.ru;
  const meta = TERMS_META[lang] || TERMS_META.ru;

  const headings: Record<string, string> = {
    ru: "Пользовательское соглашение",
    en: "Terms of Service",
    ko: "이용약관",
    ka: "მომხმარებლის შეთანხმება",
    ar: "اتفاقية المستخدم",
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#001f45] to-[#0d1b2a]">
      <section className="bg-gradient-to-br from-[#002C5F] to-[#001f45] py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            {headings[lang] || headings.ru}
          </h1>
          <p className="text-white/60 text-sm mt-2">{meta.description}</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <article className="rounded-2xl p-6 md:p-10 space-y-6" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {content.sections.map((section) => (
            <section key={section.title} className="space-y-2 pb-6 border-b last:border-0 last:pb-0" style={{ borderColor: "rgba(74,74,74,0.2)" }}>
              <h2 className="text-base font-semibold" style={{ color: "var(--axis-white)" }}>
                {section.title}
              </h2>
              <p className="leading-relaxed text-sm" style={{ color: "var(--axis-gray)" }}>
                {section.text}
              </p>
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}
