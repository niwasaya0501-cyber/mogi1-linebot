import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/adminAuth";
import FaqAdmin from "@/app/admin/FaqAdmin";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!isValidSessionToken(token)) {
    redirect("/admin/login");
  }

  return <FaqAdmin />;
}
