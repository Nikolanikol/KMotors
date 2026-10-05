// Тексты окна входа — парами [ru, en], как у витрины аукциона (lang.ts):
// окно открывается в основном с аукциона, а он по-английски на всех локалях.

import type { Pair } from "@/lib/carnect/lang";

export const AUTH_TEXT = {
  titlePrice: ["Войдите, чтобы увидеть цену", "Sign in to see the price"],
  subPrice: [
    "Цены аукционов открыты зарегистрированным клиентам. Это бесплатно и занимает минуту.",
    "Auction prices are available to registered clients. It's free and takes a minute.",
  ],
  google: ["Продолжить с Google", "Continue with Google"],
  or: ["или", "or"],
  register: ["Регистрация", "Create account"],
  login: ["Вход", "Sign in"],
  name: ["Имя", "Name"],
  phone: ["Телефон или WhatsApp", "Phone or WhatsApp"],
  email: ["Email", "Email"],
  password: ["Пароль (от 6 символов)", "Password (6+ characters)"],
  submitRegister: ["Зарегистрироваться и увидеть цену", "Create account and see the price"],
  submitLogin: ["Войти", "Sign in"],
  haveAccount: ["Уже есть аккаунт? Войти", "Already have an account? Sign in"],
  noAccount: ["Нет аккаунта? Регистрация", "No account? Create one"],
  errorInvalid: ["Неверный email или пароль", "Wrong email or password"],
  errorWeak: ["Пароль — не меньше 6 символов", "Password must be at least 6 characters"],
  errorExists: ["Такой email уже зарегистрирован — войдите", "This email is already registered — sign in"],
  errorPhone: ["Укажите телефон — менеджер свяжется по лоту", "Please add a phone — a manager will contact you about the lot"],
  errorGeneric: ["Не получилось, попробуйте ещё раз", "Something went wrong, please try again"],
  checkEmail: [
    "Мы отправили письмо для подтверждения. Откройте его и вернитесь на эту страницу.",
    "We sent a confirmation email. Open it and come back to this page.",
  ],
  close: ["Закрыть", "Close"],
  terms: ["Регистрируясь, вы соглашаетесь, что менеджер может связаться с вами.", "By signing up you agree that a manager may contact you."],
} satisfies Record<string, Pair>;
