import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAdminLandingPath } from "@/libs/auth/access";

export default async function AdminPage() {
  const session = await auth();
  redirect(getAdminLandingPath(session?.user));
}
