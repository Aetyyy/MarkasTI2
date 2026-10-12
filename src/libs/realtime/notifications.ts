import { RedisRealtimeHub } from "@/libs/realtime/redisHub";

type Client = { userId: string | null };
export type NotificationEvent = {
  type: "notification" | "task" | "schedule" | "gallery" | "announcement";
  title: string;
  body: string;
  url?: string;
  referenceId?: string;
};
type NotificationEnvelope = { event: NotificationEvent; userIds?: string[] };

const globalState = globalThis as typeof globalThis & {
  notificationHub?: RedisRealtimeHub<NotificationEnvelope, Client>;
};
const hub = globalState.notificationHub ?? new RedisRealtimeHub<NotificationEnvelope, Client>(
  "markasti:realtime:notifications",
  ({ event }) => `event: notification\ndata: ${JSON.stringify(event)}\n\n`,
  ({ userIds }, client) => !userIds || (!!client.userId && userIds.includes(client.userId)),
);
globalState.notificationHub = hub;

export function addNotificationClient(id: string, client: Client & { controller: ReadableStreamDefaultController<Uint8Array> }) {
  hub.add(id, client.controller, { userId: client.userId });
}
export function removeNotificationClient(id: string) { hub.remove(id); }
export function broadcastNotification(event: NotificationEvent, userIds?: string[]) {
  hub.publish({ event, userIds });
}
