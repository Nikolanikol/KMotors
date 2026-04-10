import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import EditPostClient from "./EditPostClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: Props) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  const password = process.env.ADMIN_PASSWORD;

  if (!session || session.value !== password) {
    redirect("/admin/login");
  }

  const { id } = await params;
  return <EditPostClient id={id} />;
}
