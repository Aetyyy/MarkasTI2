import "server-only";
import { publishRealtime } from "@/libs/realtime/broadcast";

export type NotificationEvent = {
  type: "notification" | "task" | "schedule" | "gallery" | "announcement";
  title: string;
  body: string;
  url?: string;
  referenceId?: string;
};

/** Only publish an invalidation hint. Notification contents stay behind the authenticated API. */
export async function broadcastNotification(_event: NotificationEvent, userIds?: string[]) {
  const topics = userIds?.length
    ? [...new Set(userIds)].map((id) => `markasti-notifications-user-${id}`)
    : ["markasti-notifications"];
  await Promise.all(topics.map((topic) => publishRealtime(topic, "invalidation", { changed: true })));
}
