import { PERMISSION_SCOPES } from "@/libs/auth/access";
import { requirePagePermission } from "@/libs/auth/authorization";

export default async function ChangelogAccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePagePermission(PERMISSION_SCOPES.changelogs, "read");
  return children;
}
