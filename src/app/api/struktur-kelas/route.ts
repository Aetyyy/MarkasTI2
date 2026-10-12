import { prisma } from "@/libs/prisma";
import { roleLabels } from "@/types/member";

export const dynamic = "force-dynamic";

export async function GET() {
  const members = await prisma.user.findMany({
    orderBy: [{ sortOrder: "asc" }, { classPosition: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      teamImage: true,
      image: true,
      codeName: true,
      classPosition: true,
      publicProfile: true,
      showSocials: true,
      instagram: true,
      facebook: true,
      discord: true,
      tiktok: true,
      github: true,
      website: true,
    },
  });

  return Response.json({
    ok: true,
    data: members.map((member) => ({
      id: member.id,
      name: member.name,
      role: roleLabels[member.classPosition],
      contact: member.publicProfile ? member.phone || member.email : undefined,
      phone: member.publicProfile ? member.phone || undefined : undefined,
      email: member.publicProfile ? member.email : undefined,
      codeName: member.codeName || undefined,
      socials: member.publicProfile && member.showSocials
        ? {
            instagram: member.instagram || undefined,
            facebook: member.facebook || undefined,
            discord: member.discord || undefined,
            tiktok: member.tiktok || undefined,
            github: member.github || undefined,
            website: member.website || undefined,
          }
        : null,
    })),
  });
}
