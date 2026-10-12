import { requirePagePermission } from "@/libs/auth/authorization";
import { PERMISSION_SCOPES } from "@/libs/auth/access";

export default async function AttendanceAccessLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission(PERMISSION_SCOPES.attendance, "read");
  return children;
}
