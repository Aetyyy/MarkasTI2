import { getTeamPresenceAction } from "@/app/presence/actions";
import { prisma } from "@/libs/prisma";
import AnggotaClient from "./teamClient";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const presence = await getTeamPresenceAction();
  const presenceMap = new Map(presence.map((item) => [item.id, item.status]));

  const members = await prisma.user.findMany({
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        classPosition: "asc",
      },
      {
        name: "asc",
      },
    ],
    include: {
      skills: {
        orderBy: {
          createdAt: "asc",
        },
      },
      organizations: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  const formattedMembers = members.map((member) => {
    const isPrivate = !member.publicProfile;

    return {
      id: member.id,
      name: member.name,
      nim: isPrivate ? "" : member.nim,
      role: member.classPosition,
      // Team images are configured separately from personal profile privacy.
      // Keep the class-team photo visible while still hiding private details.
      image: member.teamImage,
      quote: isPrivate ? "" : member.quote,
      codeName: isPrivate ? null : member.codeName,
      status: presenceMap.get(member.id) ?? "OFFLINE",
      sortOrder: member.sortOrder,
      isPrivate,
      skills: isPrivate ? [] : member.skills.map((skill) => skill.name),
      organizations: isPrivate
        ? []
        : member.organizations.map((organization) => ({
            name: organization.name,
            rank: organization.rank,
          })),
      socials:
        isPrivate || !member.showSocials
          ? null
          : {
              instagram: member.instagram,
              facebook: member.facebook,
              discord: member.discord,
              tiktok: member.tiktok,
              github: member.github,
            },
    };
  });

  return <AnggotaClient members={formattedMembers} />;
}
