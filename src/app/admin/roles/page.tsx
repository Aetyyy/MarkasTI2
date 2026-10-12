import RoleManagement from "@/components/admin/roleManagement";
import { requirePagePermission } from "@/libs/auth/authorization";
import { getCrudAccess, PERMISSION_SCOPES } from "@/libs/auth/access";
import {
  getPermissionScopeOptionsForAdmin,
  getRolesWithPermissionsForAdmin,
} from "@/libs/roles/query";
import { ensurePermissionScopeCatalog } from "@/libs/auth/scopeCatalog";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  const user = await requirePagePermission(PERMISSION_SCOPES.roles, "read");
  const access = getCrudAccess(user, PERMISSION_SCOPES.roles);
  await ensurePermissionScopeCatalog();

  const [roles, permissionScopes] = await Promise.all([
    getRolesWithPermissionsForAdmin(),
    getPermissionScopeOptionsForAdmin(),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <RoleManagement
        initialRoles={roles}
        initialPermissionScopes={permissionScopes}
        access={access}
      />
    </main>
  );
}
