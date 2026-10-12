import { requirePagePermission } from "@/libs/auth/authorization";
import { PERMISSION_SCOPES } from "@/libs/auth/access";

export default async function ClassStructureAccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePagePermission(PERMISSION_SCOPES.classStructure, "read");
  return children;
}
