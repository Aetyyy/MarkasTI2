import "server-only";
import { publishRealtime } from "@/libs/realtime/broadcast";

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

export function broadcastChat(event: ChatRealtimeEvent) {
  return publishRealtime("markasti-chat", "chat", event);
}
