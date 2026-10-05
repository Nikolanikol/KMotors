"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Save, CheckCircle } from "lucide-react";

interface Profile {
  name: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  zip: string | null;
  preferred_lang: string | null;
}

interface Props {
  lang: string;
  user: { id: string; email: string };
  profile: Profile | null;
}

const COUNTRIES = [
  { code: "RU", name: { ru: "Россия", en: "Russia", ko: "러시아", ka: "რუსეთი", ar: "روسيا" } },
  { code: "KZ", name: { ru: "Казахстан", en: "Kazakhstan", ko: "카자흐스탄", ka: "ყაზახეთი", ar: "كازاخستان" } },
  { code: "UZ", name: { ru: "Узбекистан", en: "Uzbekistan", ko: "우즈베키스탄", ka: "უზბეკეთი", ar: "أوزبكستان" } },
  { code: "GE", name: { ru: "Грузия", en: "Georgia", ko: "조지아", ka: "საქართველო", ar: "جورجيا" } },
  { code: "AE", name: { ru: "ОАЭ", en: "UAE", ko: "아랍에미리트", ka: "არაბეთის საემირო", ar: "الإمارات" } },
  { code: "SA", name: { ru: "Саудовская Аравия", en: "Saudi Arabia", ko: "사우디아라비아", ka: "საუდის არაბეთი", ar: "السعودية" } },
  { code: "BY", name: { ru: "Беларусь", en: "Belarus", ko: "벨라루스", ka: "ბელარუსი", ar: "بيلاروسيا" } },
  { code: "AM", name: { ru: "Армения", en: "Armenia", ko: "아르메니아", ka: "სომხეთი", ar: "أرمينيا" } },
];

const L: Record<string, Record<string, string>> = {
  ru: { title: "Личные данные", name: "Имя", phone: "Телефон", country: "Страна", city: "Город", address: "Адрес", zip: "Индекс", save: "Сохранить", saving: "Сохранение...", saved: "Сохранено!", email: "Email", emailNote: "Email изменить нельзя", selectCountry: "Выберите страну", shippingAddress: "Адрес доставки", saveError: "Ошибка при сохранении" },
  en: { title: "Personal Info", name: "Name", phone: "Phone", country: "Country", city: "City", address: "Address", zip: "ZIP / Postal Code", save: "Save", saving: "Saving...", saved: "Saved!", email: "Email", emailNote: "Email cannot be changed", selectCountry: "Select country", shippingAddress: "Shipping address", saveError: "Could not save" },
  ko: { title: "개인 정보", name: "이름", phone: "전화번호", country: "국가", city: "도시", address: "주소", zip: "우편번호", save: "저장", saving: "저장 중...", saved: "저장됨!", email: "이메일", emailNote: "이메일은 변경할 수 없습니다", selectCountry: "국가 선택", shippingAddress: "배송 주소", saveError: "저장 실패" },
  ka: { title: "პირადი ინფორმაცია", name: "სახელი", phone: "ტელეფონი", country: "ქვეყანა", city: "ქალაქი", address: "მისამართი", zip: "საფოსტო კოდი", save: "შენახვა", saving: "ინახება...", saved: "შენახულია!", email: "ელ-ფოსტა", emailNote: "ელ-ფოსტის შეცვლა შეუძლებელია", selectCountry: "აირჩიეთ ქვეყანა", shippingAddress: "მიწოდების მისამართი", saveError: "შენახვა ვერ მოხერხდა" },
  ar: { title: "البيانات الشخصية", name: "الاسم", phone: "الهاتف", country: "البلد", city: "المدينة", address: "العنوان", zip: "الرمز البريدي", save: "حفظ", saving: "جارٍ الحفظ...", saved: "تم الحفظ!", email: "البريد الإلكتروني", emailNote: "لا يمكن تغيير البريد الإلكتروني", selectCountry: "اختر البلد", shippingAddress: "عنوان التوصيل", saveError: "تعذر الحفظ" },
};

export default function ProfileForm({ lang, user, profile }: Props) {
  const l = L[lang] ?? L.ru;
  const supabase = createClient();

  const [name, setName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [country, setCountry] = useState(profile?.country ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [address, setAddress] = useState(profile?.address ?? "");
  const [zip, setZip] = useState(profile?.zip ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");

    const { error } = await supabase
      .from("profiles")
      .update({ name: name || null, phone: phone || null, country: country || null, city: city || null, address: address || null, zip: zip || null })
      .eq("id", user.id);

    if (error) {
      setStatus("error");
    } else {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  // Поле на карточке — графит, светлее карточки: иначе граница поля не видна.
  // [color-scheme:dark] — чтобы выпадающий список <select> и автозаполнение
  // браузера тоже были тёмными, а не белыми поверх тёмной страницы.
  const fieldBase = "w-full px-4 py-2.5 border rounded-xl text-sm transition [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-[rgba(182,119,73,0.6)] focus:border-transparent";
  const inputClass = `${fieldBase} border-white/10 bg-[var(--axis-graphite)] text-[var(--axis-white)] placeholder:text-[var(--axis-gray-dim)] hover:border-[rgba(182,119,73,0.45)]`;

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <h2 className="text-lg font-bold text-[var(--axis-white)]">{l.title}</h2>

      {/* Email (readonly) */}
      <div>
        <label className="block text-sm font-medium text-[var(--axis-silver)] mb-1">{l.email}</label>
        <input
          type="text"
          value={user.email}
          readOnly
          className={`${fieldBase} border-white/[0.06] bg-white/[0.02] text-[var(--axis-gray)] cursor-not-allowed`}
        />
        <p className="text-xs text-[var(--axis-gray)] mt-1">{l.emailNote}</p>
      </div>

      {/* Имя + телефон */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--axis-silver)] mb-1">{l.name}</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={l.name} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--axis-silver)] mb-1">{l.phone}</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 999 000 00 00" className={inputClass} />
        </div>
      </div>

      <div className="border-t border-white/[0.06] pt-4">
        <p className="text-xs font-semibold text-[var(--axis-gray)] uppercase tracking-wide mb-4">{l.shippingAddress}</p>

        {/* Страна */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--axis-silver)] mb-1">{l.country}</label>
          <select value={country} onChange={e => setCountry(e.target.value)} className={inputClass}>
            <option value="">{l.selectCountry}</option>
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>
                {c.name[lang as keyof typeof c.name] ?? c.name.en}
              </option>
            ))}
          </select>
        </div>

        {/* Город + индекс */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-[var(--axis-silver)] mb-1">{l.city}</label>
            <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder={l.city} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--axis-silver)] mb-1">{l.zip}</label>
            <input type="text" value={zip} onChange={e => setZip(e.target.value)} placeholder="000000" className={inputClass} />
          </div>
        </div>

        {/* Адрес */}
        <div>
          <label className="block text-sm font-medium text-[var(--axis-silver)] mb-1">{l.address}</label>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder={l.address} className={inputClass} />
        </div>
      </div>

      {/* Кнопка */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={status === "saving"}
          className="flex items-center gap-2 px-6 py-2.5 bg-[var(--axis-bronze-deep)] bg-[image:var(--axis-bronze-fill)] shadow-[0_6px_20px_-8px_rgba(157,94,52,0.8)] hover:brightness-115 active:scale-[0.99] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition disabled:cursor-wait"
        >
          {status === "saving" ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{l.saving}</>
          ) : (
            <><Save className="w-4 h-4" />{l.save}</>
          )}
        </button>

        {status === "saved" && (
          <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            {l.saved}
          </span>
        )}
        {status === "error" && (
          <span className="text-red-400 text-sm">{l.saveError}</span>
        )}
      </div>
    </form>
  );
}
