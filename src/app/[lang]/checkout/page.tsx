import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckoutClient from "./CheckoutClient";

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function CheckoutPage({ params }: Props) {
  const { lang } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${lang}/auth?from=/${lang}/checkout`);
  }

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!cart) redirect(`/${lang}/parts`);

  const { data: cartItems } = await supabase
    .from("cart_items")
    .select("id, quantity, product_id")
    .eq("cart_id", cart.id);

  if (!cartItems?.length) redirect(`/${lang}/parts`);

  const productIds = cartItems.map((i) => i.product_id);

  const { data: products } = await supabase
    .from("parts_products")
    .select(
      "id, part_number, name_ru, name_en, price_krw, image_url, weight_kg, ship_method, category_id, subcategory_id"
    )
    .in("id", productIds);

  // subcategory_id имеет приоритет (конкретная L2/L3 категория — там назначен ship_method)
  // Тот же подход, что и на странице товара
  const logisticsCatIds = [
    ...new Set(
      (products ?? [])
        .map((p) => (p.subcategory_id ?? p.category_id))
        .filter(Boolean) as number[]
    ),
  ];

  const { data: logistics } = logisticsCatIds.length
    ? await supabase
        .from("v_category_logistics")
        .select("id, weight_avg_kg, billed_weight_kg, ship_method, length_cm, width_cm, height_cm")
        .in("id", logisticsCatIds)
    : { data: [] as { id: number; weight_avg_kg: number | null; billed_weight_kg: number | null; ship_method: string | null; length_cm: number | null; width_cm: number | null; height_cm: number | null }[] };

  const items = cartItems.map((ci) => {
    const p = products?.find((x) => x.id === ci.product_id);
    const logisticsCatId = (p?.subcategory_id ?? p?.category_id) as number | null;
    const cat = logistics?.find((x) => x.id === logisticsCatId);

    // Вес: реальный замер продукта → category avg → fallback 1 кг
    const weight = (p?.weight_kg ?? cat?.weight_avg_kg ?? 1.0) as number;
    // billed_weight из view (если есть) или пересчитываем с реальным весом продукта
    const billedWeightKg = cat?.billed_weight_kg
      ? p?.weight_kg
        ? Math.round(Math.max(p.weight_kg * 1.12,
            cat.length_cm && cat.width_cm && cat.height_cm
              ? (cat.length_cm * cat.width_cm * cat.height_cm) / 5000
              : 0) * 1000) / 1000
        : (cat.billed_weight_kg as number)
      : Math.round(weight * 1.12 * 1000) / 1000;

    return {
      cartItemId: ci.id as string,
      quantity: ci.quantity as number,
      productId: ci.product_id as number,
      partNumber: (p?.part_number ?? "") as string,
      nameRu: (p?.name_ru ?? "") as string,
      nameEn: (p?.name_en ?? "") as string,
      priceKrw: (p?.price_krw ?? 0) as number,
      imageUrl: (p?.image_url ?? null) as string | null,
      weightKg: weight,
      billedWeightKg,
      shipMethod: (p?.ship_method ?? cat?.ship_method ?? "CLARIFY") as
        | "EMS"
        | "EMS_PREMIUM"
        | "SEA"
        | "CLARIFY",
    };
  });

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, phone, country, city, address, zip")
    .eq("id", user.id)
    .single();

  return (
    <CheckoutClient
      lang={lang}
      userId={user.id}
      items={items}
      profile={profile ?? {}}
    />
  );
}
