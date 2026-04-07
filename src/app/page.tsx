import { redirect } from "next/navigation";

// Middleware обрабатывает редирект раньше, но на случай прямого рендера
export default function RootPage() {
  redirect("/ru/");
}
