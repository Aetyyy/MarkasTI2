import PermissionManagement from "@/components/admin/permissionManagement";
import { requirePagePermission } from "@/libs/auth/authorization";
import { getCrudAccess, PERMISSION_SCOPES } from "@/libs/auth/access";
import { getPermissionScopesForAdmin } from "@/libs/permissions/query";

export const dynamic = "force-dynamic";

export default async function AdminPermissionsPage() {
  const user = await requirePagePermission(
    PERMISSION_SCOPES.permissions,
    "read",
  );
  const access = getCrudAccess(user, PERMISSION_SCOPES.permissions);

  const permissions = await getPermissionScopesForAdmin();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <PermissionManagement initialPermissions={permissions} access={access} />
    </main>
  );
}
