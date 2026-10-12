"use server";

import { auth } from "@/auth";
import { prisma } from "@/libs/prisma";

export type PresenceStatus = "ONLINE" | "OFFLINE";

const ONLINE_LIMIT_MS = 70 * 1000;

async function getSessionUserId() {
  const session = await auth();

  if (!session?.user?.id) return null;

  return session.user.id;
}

export async function updateMyPresenceAction(
  status: PresenceStatus = "ONLINE",
) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return {
        ok: false,
        message: "Belum login.",
      };
    }

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        status,
        lastSeenAt: status === "ONLINE" ? new Date() : null,
      },
    });

    return {
      ok: true,
      message: "Presence updated.",
    };
  } catch {
    return {
      ok: false,
      message: "Gagal update presence.",
    };
  }
}

export async function getTeamPresenceAction() {
  const cutoff = new Date(Date.now() - ONLINE_LIMIT_MS);

  await prisma.user.updateMany({
    where: {
      status: "ONLINE",
      OR: [
        {
          lastSeenAt: null,
        },
        {
          lastSeenAt: {
            lt: cutoff,
          },
        },
      ],
    },
    data: {
      status: "OFFLINE",
      lastSeenAt: null,
    },
  });

  const users = await prisma.user.findMany({
    select: {
      id: true,
      nim: true,
      status: true,
      lastSeenAt: true,
    },
  });

  return users.map((user) => {
    const online =
      user.status === "ONLINE" &&
      Boolean(user.lastSeenAt) &&
      user.lastSeenAt!.getTime() >= cutoff.getTime();

    return {
      id: user.id,
      nim: user.nim,
      status: online ? ("ONLINE" as const) : ("OFFLINE" as const),
      lastSeenAt: user.lastSeenAt?.toISOString() ?? null,
    };
  });
}
