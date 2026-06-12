"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";

interface Props {
  lang: string;
  initialMode: "login" | "register";
  from?: string;
}

type Mode = "login" | "register";

const LABELS: Record<string, Record<string, string>> = {
  ru: {
    login: "Войти",
    register: "Регистрация",
    email: "Email",
    password: "Пароль",
    name: "Имя (необязательно)",
    noAccount: "Нет аккаунта?",
    hasAccount: "Уже есть аккаунт?",
    signUp: "Зарегистрироваться",
    signIn: "Войти",
    orGoogle: "или войти через",
    forgotPassword: "Забыли пароль?",
    errorInvalid: "Неверный email или пароль",
    errorEmail: "Этот email уже зарегистрирован",
    errorWeak: "Пароль должен быть не менее 6 символов",
    successRegister: "Аккаунт создан! Входим...",
  },
  en: {
    login: "Sign In",
    register: "Sign Up",
    email: "Email",
    password: "Password",
    name: "Name (optional)",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    signUp: "Create Account",
    signIn: "Sign In",
    orGoogle: "or continue with",
    forgotPassword: "Forgot password?",
    errorInvalid: "Invalid email or password",
    errorEmail: "This email is already registered",
    errorWeak: "Password must be at least 6 characters",
    successRegister: "Account created! Signing in...",
  },
  ko: {
    login: "로그인",
    register: "회원가입",
    email: "이메일",
    password: "비밀번호",
    name: "이름 (선택 사항)",
    noAccount: "계정이 없으신가요?",
    hasAccount: "이미 계정이 있으신가요?",
    signUp: "계정 만들기",
    signIn: "로그인",
    orGoogle: "또는",
    forgotPassword: "비밀번호를 잊으셨나요?",
    errorInvalid: "이메일 또는 비밀번호가 올바르지 않습니다",
    errorEmail: "이미 등록된 이메일입니다",
    errorWeak: "비밀번호는 6자 이상이어야 합니다",
    successRegister: "계정이 생성되었습니다!",
  },
  ka: {
    login: "შესვლა",
    register: "რეგისტრაცია",
    email: "ელ-ფოსტა",
    password: "პაროლი",
    name: "სახელი (სურვილისამებრ)",
    noAccount: "არ გაქვთ ანგარიში?",
    hasAccount: "უკვე გაქვთ ანგარიში?",
    signUp: "ანგარიშის შექმნა",
    signIn: "შესვლა",
    orGoogle: "ან გააგრძელეთ",
    forgotPassword: "პაროლი დაგავიწყდათ?",
    errorInvalid: "არასწორი ელ-ფოსტა ან პაროლი",
    errorEmail: "ეს ელ-ფოსტა უკვე რეგისტრირებულია",
    errorWeak: "პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო",
    successRegister: "ანგარიში შეიქმნა!",
  },
  ar: {
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    name: "الاسم (اختياري)",
    noAccount: "ليس لديك حساب؟",
    hasAccount: "لديك حساب بالفعل؟",
    signUp: "إنشاء حساب",
    signIn: "تسجيل الدخول",
    orGoogle: "أو تابع عبر",
    forgotPassword: "نسيت كلمة المرور؟",
    errorInvalid: "بريد إلكتروني أو كلمة مرور غير صحيحة",
    errorEmail: "هذا البريد الإلكتروني مسجل بالفعل",
    errorWeak: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
    successRegister: "تم إنشاء الحساب!",
  },
};

export default function AuthForm({ lang, initialMode, from }: Props) {
  const l = LABELS[lang] ?? LABELS.ru;
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const isRTL = lang === "ar";

  const redirectTo = from || `/${lang}/parts`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setError(l.errorInvalid);
          return;
        }
        router.push(redirectTo);
        router.refresh();
      } else {
        if (password.length < 6) {
          setError(l.errorWeak);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name.trim() || null,
              preferred_lang: lang,
            },
          },
        });
        if (error) {
          if (error.message.includes("already registered")) {
            setError(l.errorEmail);
          } else {
            setError(error.message);
          }
          return;
        }
        setSuccess(l.successRegister);
        // Сразу логиним после регистрации
        await supabase.auth.signInWithPassword({ email, password });
        router.push(redirectTo);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
      },
    });
  };

  return (
    <div
      className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Логотип */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">
          <span className="text-[#FF4500] font-extrabold">K</span>
          <span className="text-[#002C5F] font-light tracking-tight">-Axis</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {mode === "login" ? l.login : l.register}
        </p>
      </div>

      {/* Переключатель режима */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => { setMode("login"); setError(""); }}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            mode === "login"
              ? "bg-white text-[#002C5F] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {l.login}
        </button>
        <button
          onClick={() => { setMode("register"); setError(""); }}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            mode === "register"
              ? "bg-white text-[#002C5F] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {l.register}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Имя — только при регистрации */}
        {mode === "register" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {l.name}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={l.name}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#002C5F] focus:border-transparent transition"
            />
          </div>
        )}

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {l.email}
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@mail.com"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#002C5F] focus:border-transparent transition"
          />
        </div>

        {/* Пароль */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {l.password}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#002C5F] focus:border-transparent transition pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ${isRTL ? "left-3" : "right-3"}`}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl">
            {error}
          </div>
        )}

        {/* Успех */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 text-sm px-4 py-2.5 rounded-xl">
            {success}
          </div>
        )}

        {/* Кнопка Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#002C5F] hover:bg-[#001f45] disabled:bg-[#002C5F]/50 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : mode === "login" ? (
            l.signIn
          ) : (
            l.signUp
          )}
        </button>
      </form>

      {/* Разделитель */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">{l.orGoogle}</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Google */}
      <button
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-3 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 py-2.5 rounded-xl transition text-sm font-medium text-gray-700"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Google
      </button>
    </div>
  );
}
