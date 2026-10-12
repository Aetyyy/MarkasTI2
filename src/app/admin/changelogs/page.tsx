import ChangelogManager from "./changelogManager";
import { getCrudAccess, PERMISSION_SCOPES } from "@/libs/auth/access";
import { requirePagePermission } from "@/libs/auth/authorization";
import { getAdminChangelogs } from "@/libs/changelogs/query";

export const dynamic = "force-dynamic";

export default async function AdminChangelogsPage() {
  const user = await requirePagePermission(PERMISSION_SCOPES.changelogs, "read");
  const changelogs = await getAdminChangelogs();

  return (
    <ChangelogManager
      initialItems={changelogs}
      access={getCrudAccess(user, PERMISSION_SCOPES.changelogs)}
    />
  );
}
