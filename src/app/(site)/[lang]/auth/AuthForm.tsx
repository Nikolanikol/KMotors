"use client";

import { useState } from "react";
import { reportSignIn } from "@/components/Auth/authEvents";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";

interface Props {
  lang: string;
  initialMode: "login" | "register" | "reset";
  from?: string;
}

type Mode = "login" | "register" | "forgot" | "reset";

const LABELS: Record<string, Record<string, string>> = {
  ru: {
    login: "Войти",
    register: "Регистрация",
    email: "Email",
    emailPlaceholder: "you@example.com",
    password: "Пароль",
    passwordPlaceholder: "Минимум 6 символов",
    name: "Имя",
    namePlaceholder: "Как к вам обращаться",
    nameHint: "необязательно",
    noAccount: "Нет аккаунта?",
    hasAccount: "Уже есть аккаунт?",
    signUp: "Создать аккаунт",
    signIn: "Войти",
    orGoogle: "или войти через",
    forgotPassword: "Забыли пароль?",
    forgotTitle: "Восстановление пароля",
    forgotDesc: "Введите email, и мы отправим ссылку для сброса пароля",
    forgotSubmit: "Отправить ссылку",
    forgotSuccess: "Ссылка отправлена! Проверьте почту и папку «Спам»",
    forgotBack: "Назад ко входу",
    resetTitle: "Новый пароль",
    resetDesc: "Придумайте новый пароль для вашего аккаунта",
    resetSubmit: "Сохранить пароль",
    resetSuccess: "Пароль изменён! Перенаправляем...",
    newPassword: "Новый пароль",
    confirmPassword: "Подтвердите пароль",
    passwordMismatch: "Пароли не совпадают",
    passwordHint: "Минимум 6 символов",
    errorInvalid: "Неверный email или пароль",
    errorEmail: "Этот email уже зарегистрирован",
    errorWeak: "Пароль должен быть не менее 6 символов",
    successRegister: "Аккаунт создан! Входим...",
  },
  en: {
    login: "Sign In",
    register: "Sign Up",
    email: "Email",
    emailPlaceholder: "you@example.com",
    password: "Password",
    passwordPlaceholder: "At least 6 characters",
    name: "Name",
    namePlaceholder: "What should we call you",
    nameHint: "optional",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    signUp: "Create Account",
    signIn: "Sign In",
    orGoogle: "or continue with",
    forgotPassword: "Forgot password?",
    forgotTitle: "Reset Password",
    forgotDesc: "Enter your email and we'll send you a reset link",
    forgotSubmit: "Send Reset Link",
    forgotSuccess: "Reset link sent! Check your inbox and spam folder",
    forgotBack: "Back to sign in",
    resetTitle: "New Password",
    resetDesc: "Choose a new password for your account",
    resetSubmit: "Save Password",
    resetSuccess: "Password updated! Redirecting...",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    passwordMismatch: "Passwords don't match",
    passwordHint: "At least 6 characters",
    errorInvalid: "Invalid email or password",
    errorEmail: "This email is already registered",
    errorWeak: "Password must be at least 6 characters",
    successRegister: "Account created! Signing in...",
  },
  ko: {
    login: "로그인",
    register: "회원가입",
    email: "이메일",
    emailPlaceholder: "you@example.com",
    password: "비밀번호",
    passwordPlaceholder: "6자 이상",
    name: "이름",
    namePlaceholder: "이름을 입력하세요",
    nameHint: "선택 사항",
    noAccount: "계정이 없으신가요?",
    hasAccount: "이미 계정이 있으신가요?",
    signUp: "계정 만들기",
    signIn: "로그인",
    orGoogle: "또는",
    forgotPassword: "비밀번호를 잊으셨나요?",
    forgotTitle: "비밀번호 재설정",
    forgotDesc: "이메일을 입력하시면 재설정 링크를 보내드립니다",
    forgotSubmit: "재설정 링크 보내기",
    forgotSuccess: "링크를 보냈습니다! 이메일과 스팸 폴더를 확인하세요",
    forgotBack: "로그인으로 돌아가기",
    resetTitle: "새 비밀번호",
    resetDesc: "새 비밀번호를 설정하세요",
    resetSubmit: "비밀번호 저장",
    resetSuccess: "비밀번호가 변경되었습니다!",
    newPassword: "새 비밀번호",
    confirmPassword: "비밀번호 확인",
    passwordMismatch: "비밀번호가 일치하지 않습니다",
    passwordHint: "6자 이상",
    errorInvalid: "이메일 또는 비밀번호가 올바르지 않습니다",
    errorEmail: "이미 등록된 이메일입니다",
    errorWeak: "비밀번호는 6자 이상이어야 합니다",
    successRegister: "계정이 생성되었습니다!",
  },
  ka: {
    login: "შესვლა",
    register: "რეგისტრაცია",
    email: "ელ-ფოსტა",
    emailPlaceholder: "you@example.com",
    password: "პაროლი",
    passwordPlaceholder: "მინიმუმ 6 სიმბოლო",
    name: "სახელი",
    namePlaceholder: "თქვენი სახელი",
    nameHint: "სურვილისამებრ",
    noAccount: "არ გაქვთ ანგარიში?",
    hasAccount: "უკვე გაქვთ ანგარიში?",
    signUp: "ანგარიშის შექმნა",
    signIn: "შესვლა",
    orGoogle: "ან გააგრძელეთ",
    forgotPassword: "პაროლი დაგავიწყდათ?",
    forgotTitle: "პაროლის აღდგენა",
    forgotDesc: "შეიყვანეთ ელ-ფოსტა და გამოგიგზავნით აღდგენის ბმულს",
    forgotSubmit: "ბმულის გაგზავნა",
    forgotSuccess: "ბმული გაიგზავნა! შეამოწმეთ ფოსტა და სპამის საქაღალდე",
    forgotBack: "შესვლაზე დაბრუნება",
    resetTitle: "ახალი პაროლი",
    resetDesc: "შეიყვანეთ ახალი პაროლი",
    resetSubmit: "პაროლის შენახვა",
    resetSuccess: "პაროლი შეიცვალა!",
    newPassword: "ახალი პაროლი",
    confirmPassword: "დაადასტურეთ პაროლი",
    passwordMismatch: "პაროლები არ ემთხვევა",
    passwordHint: "მინიმუმ 6 სიმბოლო",
    errorInvalid: "არასწორი ელ-ფოსტა ან პაროლი",
    errorEmail: "ეს ელ-ფოსტა უკვე რეგისტრირებულია",
    errorWeak: "პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო",
    successRegister: "ანგარიში შეიქმნა!",
  },
  ar: {
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    email: "البريد الإلكتروني",
    emailPlaceholder: "you@example.com",
    password: "كلمة المرور",
    passwordPlaceholder: "6 أحرف على الأقل",
    name: "الاسم",
    namePlaceholder: "اسمك",
    nameHint: "اختياري",
    noAccount: "ليس لديك حساب؟",
    hasAccount: "لديك حساب بالفعل؟",
    signUp: "إنشاء حساب",
    signIn: "تسجيل الدخول",
    orGoogle: "أو تابع عبر",
    forgotPassword: "نسيت كلمة المرور؟",
    forgotTitle: "استعادة كلمة المرور",
    forgotDesc: "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين",
    forgotSubmit: "إرسال الرابط",
    forgotSuccess: "تم إرسال الرابط! تحقق من بريدك ومجلد الرسائل غير المرغوب فيها",
    forgotBack: "العودة لتسجيل الدخول",
    resetTitle: "كلمة مرور جديدة",
    resetDesc: "اختر كلمة مرور جديدة لحسابك",
    resetSubmit: "حفظ كلمة المرور",
    resetSuccess: "تم تغيير كلمة المرور!",
    newPassword: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور",
    passwordMismatch: "كلمتا المرور غير متطابقتين",
    passwordHint: "6 أحرف على الأقل",
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
  const [confirmPw, setConfirmPw] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const isRTL = false; // RTL-переворот отключён — макет всегда LTR (см. layout.tsx)

  const redirectTo = from || `/${lang}/parts`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError(l.errorInvalid); return; }
        // Вход тоже: подтвердивший почту позже приходит именно входом.
        reportSignIn("email");
        router.push(redirectTo);
        router.refresh();
      } else if (mode === "register") {
        if (password.length < 6) { setError(l.errorWeak); return; }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name.trim() || null, preferred_lang: lang, signup_source: "auth_page" } },
        });
        if (error) {
          setError(error.message.includes("already registered") ? l.errorEmail : error.message);
          return;
        }
        setSuccess(l.successRegister);
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        // Без сессии (почта ещё не подтверждена) сервер не узнает, кто это, —
        // уведомление уйдёт при первом входе после подтверждения.
        if (!loginError) reportSignIn("email");
        router.push(redirectTo);
        router.refresh();
      } else if (mode === "forgot") {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, lang }),
        });
        if (!res.ok) { setError("Something went wrong"); return; }
        setSuccess(l.forgotSuccess);
      } else if (mode === "reset") {
        if (password.length < 6) { setError(l.errorWeak); return; }
        if (password !== confirmPw) { setError(l.passwordMismatch); return; }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) { setError(error.message); return; }
        setSuccess(l.resetSuccess);
        setTimeout(() => { router.push(`/${lang}/parts`); router.refresh(); }, 1500);
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

  const switchMode = (m: Mode) => { setMode(m); setError(""); setSuccess(""); };

  // Поля и карточка — те же токены, что у окна входа (Auth/AuthModal.tsx): одна
  // форма входа на сайте не должна выглядеть двумя разными продуктами.
  const inputCls = "w-full px-4 py-2.5 border border-white/10 rounded-xl text-sm bg-[var(--axis-graphite)] text-[var(--axis-white)] placeholder:text-[var(--axis-gray-dim)] [color-scheme:dark] hover:border-[rgba(182,119,73,0.45)] focus:outline-none focus:ring-2 focus:ring-[rgba(182,119,73,0.6)] focus:border-transparent transition";

  return (
    <div
      className="w-full max-w-md rounded-2xl p-8"
      style={{
        backgroundColor: "var(--axis-charcoal)",
        border: "1px solid rgba(182,119,73,0.3)",
        boxShadow:
          "0 2px 6px rgba(0,0,0,0.5), 0 24px 64px -8px rgba(0,0,0,0.9), 0 0 48px -6px rgba(182,119,73,0.22), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Logo */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">
          <span className="text-[var(--axis-bronze)] font-extrabold">K</span>
          <span className="text-[var(--axis-white)] font-light tracking-tight">-Axis</span>
        </h1>
      </div>

      {/* Forgot / Reset — header with back button */}
      {(mode === "forgot" || mode === "reset") && (
        <div className="mb-6">
          {mode === "forgot" && (
            <button
              onClick={() => switchMode("login")}
              className="flex items-center gap-1 text-sm text-[var(--axis-gray)] hover:text-[var(--axis-white)] transition mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              {l.forgotBack}
            </button>
          )}
          <h2 className="text-lg font-bold text-[var(--axis-white)]">
            {mode === "forgot" ? l.forgotTitle : l.resetTitle}
          </h2>
          <p className="text-sm text-[var(--axis-gray)] mt-1">
            {mode === "forgot" ? l.forgotDesc : l.resetDesc}
          </p>
        </div>
      )}

      {/* Tab switcher — only for login/register */}
      {(mode === "login" || mode === "register") && (
        <div className="flex bg-[var(--axis-graphite)] border border-white/[0.06] rounded-xl p-1 mb-6">
          <button
            onClick={() => switchMode("login")}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              mode === "login"
                ? "bg-[var(--axis-bronze-deep)] bg-[image:var(--axis-bronze-fill)] text-white shadow-[0_4px_14px_-6px_rgba(157,94,52,0.9)]"
                : "text-[var(--axis-gray)] hover:text-[var(--axis-white)] hover:bg-white/[0.06]"
            }`}
          >
            {l.login}
          </button>
          <button
            onClick={() => switchMode("register")}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              mode === "register"
                ? "bg-[var(--axis-bronze-deep)] bg-[image:var(--axis-bronze-fill)] text-white shadow-[0_4px_14px_-6px_rgba(157,94,52,0.9)]"
                : "text-[var(--axis-gray)] hover:text-[var(--axis-white)] hover:bg-white/[0.06]"
            }`}
          >
            {l.register}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name — register only */}
        {mode === "register" && (
          <div>
            <label className="block text-sm font-medium text-[var(--axis-silver)] mb-1">
              {l.name} <span className="text-[var(--axis-gray)] font-normal">({l.nameHint})</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={l.namePlaceholder}
              autoComplete="name"
              className={inputCls}
            />
          </div>
        )}

        {/* Email — login, register, forgot */}
        {mode !== "reset" && (
          <div>
            <label className="block text-sm font-medium text-[var(--axis-silver)] mb-1">
              {l.email}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={l.emailPlaceholder}
              autoComplete="email"
              className={inputCls}
            />
          </div>
        )}

        {/* Password — login, register */}
        {(mode === "login" || mode === "register") && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-[var(--axis-silver)]">
                {l.password}
              </label>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-xs text-[var(--axis-bronze)] hover:text-[var(--axis-bronze-bright)] hover:underline underline-offset-2 transition"
                >
                  {l.forgotPassword}
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className={`${inputCls} ${isRTL ? "pl-10" : "pr-10"}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute top-1/2 -translate-y-1/2 text-[var(--axis-gray)] hover:text-[var(--axis-white)] ${isRTL ? "left-3" : "right-3"}`}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {mode === "register" && (
              <p className="text-xs text-[var(--axis-gray)] mt-1">{l.passwordHint}</p>
            )}
          </div>
        )}

        {/* New password + confirm — reset mode */}
        {mode === "reset" && (
          <>
            <div>
              <label className="block text-sm font-medium text-[var(--axis-silver)] mb-1">
                {l.newPassword}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={l.passwordPlaceholder}
                  autoComplete="new-password"
                  className={`${inputCls} ${isRTL ? "pl-10" : "pr-10"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-[var(--axis-gray)] hover:text-[var(--axis-white)] ${isRTL ? "left-3" : "right-3"}`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-[var(--axis-gray)] mt-1">{l.passwordHint}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--axis-silver)] mb-1">
                {l.confirmPassword}
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`${inputCls} ${isRTL ? "pl-10" : "pr-10"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className={`absolute top-1/2 -translate-y-1/2 text-[var(--axis-gray)] hover:text-[var(--axis-white)] ${isRTL ? "left-3" : "right-3"}`}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-2.5 rounded-xl">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-2.5 rounded-xl">
            {success}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !!success}
          className="w-full bg-[var(--axis-bronze-deep)] bg-[image:var(--axis-bronze-fill)] shadow-[0_6px_20px_-6px_rgba(157,94,52,0.7)] hover:brightness-115 hover:shadow-[0_8px_26px_-6px_rgba(182,119,73,0.85)] active:scale-[0.99] disabled:opacity-60 disabled:cursor-wait disabled:hover:brightness-100 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : mode === "login" ? (
            l.signIn
          ) : mode === "register" ? (
            l.signUp
          ) : mode === "forgot" ? (
            l.forgotSubmit
          ) : (
            l.resetSubmit
          )}
        </button>
      </form>

      {/* Google + divider — login/register only */}
      {(mode === "login" || mode === "register") && (
        <>
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-[var(--axis-gray)]">{l.orGoogle}</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-[#ECECEC] shadow-sm hover:shadow-md active:scale-[0.99] py-2.5 rounded-xl transition text-sm font-semibold text-[#1f1f1f]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
        </>
      )}
    </div>
  );
}
