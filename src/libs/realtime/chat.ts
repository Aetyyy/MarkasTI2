import { RedisRealtimeHub } from "@/libs/realtime/redisHub";

export type ChatRealtimeMessage = {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; image: string | null; classPosition: string };
};

export type ChatRealtimeEvent =
  | { type: "CHAT_CREATED"; message: ChatRealtimeMessage }
  | { type: "CHAT_UPDATED"; message: ChatRealtimeMessage }
  | { type: "PROFILE_UPDATED"; userId: string; image: string | null }
  | { type: "CHAT_DELETED"; messageId: string };

const globalState = globalThis as typeof globalThis & { chatHub?: RedisRealtimeHub<ChatRealtimeEvent> };
const hub = globalState.chatHub ?? new RedisRealtimeHub<ChatRealtimeEvent>(
  "markasti:realtime:chat",
  (event) => `event: chat\ndata: ${JSON.stringify(event)}\n\n`,
);
globalState.chatHub = hub;

export function addChatClient(id: string, controller: ReadableStreamDefaultController<Uint8Array>) {
  hub.add(id, controller, undefined);
}
export function removeChatClient(id: string) { hub.remove(id); }
export function broadcastChat(event: ChatRealtimeEvent) { hub.publish(event); }
