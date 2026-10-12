import { getTeamPresenceAction } from "@/app/presence/actions";
import { prisma } from "@/libs/prisma";
import TeamDashboardClient from "./teamDashboardClient";
import { canAccess, PERMISSION_SCOPES } from "@/libs/auth/access";
import { requirePermission } from "@/libs/auth/authorization";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  const user = await requirePermission(PERMISSION_SCOPES.teams, "read");

  const canUpdateTeam = canAccess(user, PERMISSION_SCOPES.teams, "update");
  const canCreatePreset = canAccess(user, PERMISSION_SCOPES.teams, "create");

  const presence = await getTeamPresenceAction();
  const presenceMap = new Map(presence.map((item) => [item.id, item.status]));

  const users = await prisma.user.findMany({
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        name: "asc",
      },
    ],
    select: {
      id: true,
      name: true,
      nim: true,
      email: true,
      teamImage: true,
      codeName: true,
      classPosition: true,
      publicProfile: true,
      showSocials: true,
      sortOrder: true,
      updatedAt: true,
    },
  });

  const presets = await prisma.teamIdentityPreset.findMany({
    where: { isActive: true },
    orderBy: [{ code: "asc" }],
    select: { id: true, code: true, name: true, logoUrl: true },
  });

  const members = users.map((user) => ({
    id: user.id,
    name: user.name,
    nim: user.nim,
    email: user.email,
    teamImage: user.teamImage,
    codeName: user.codeName,
    classPosition: user.classPosition,
    status: presenceMap.get(user.id) ?? "OFFLINE",
    publicProfile: Boolean(user.publicProfile),
    showSocials: Boolean(user.showSocials),
    sortOrder: user.sortOrder,
    updatedAt: user.updatedAt.toISOString(),
  }));

  return (
    <TeamDashboardClient
      initialMembers={members}
      initialPresets={presets}
      canUpdateTeam={canUpdateTeam}
      canCreatePreset={canCreatePreset}
    />
  );
}
