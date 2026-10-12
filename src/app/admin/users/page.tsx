import UserManagement from "@/components/admin/userManagement";
import { requirePagePermission } from "@/libs/auth/authorization";
import { getCrudAccess, PERMISSION_SCOPES } from "@/libs/auth/access";
import { getAllUsersForAdmin, getAllRolesForAdmin } from "@/libs/users/query";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const user = await requirePagePermission(PERMISSION_SCOPES.users, "read");
  const access = getCrudAccess(user, PERMISSION_SCOPES.users);

  const [users, roles] = await Promise.all([
    getAllUsersForAdmin(),
    getAllRolesForAdmin(),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <UserManagement
        initialUsers={users}
        initialRoles={roles}
        access={access}
      />
    </main>
  );
}
