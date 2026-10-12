import "server-only";

import { prisma } from "@/libs/prisma";
import { sendPushToUsers, type PushPayload } from "@/libs/notifications/push";
import { broadcastNotification } from "@/libs/realtime/notifications";

type Preference = "notifyGalleryUploads" | "notifyAnnouncements";

export async function broadcastToInterestedUsers(
  preference: Preference,
  payload: PushPayload,
  excludedUserId?: string,
) {
  const users = await prisma.user.findMany({
    where: {
      [preference]: true,
      ...(excludedUserId ? { id: { not: excludedUserId } } : {}),
    },
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);
  if (userIds.length === 0) return;

  await prisma.userNotification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: payload.type || "notification",
      title: payload.title,
      body: payload.body.slice(0, 500),
      url: payload.url,
      referenceId: payload.referenceId,
    })),
  });
  broadcastNotification({ ...payload, type: payload.type || "notification" }, userIds);
  await sendPushToUsers(userIds, payload);
}
