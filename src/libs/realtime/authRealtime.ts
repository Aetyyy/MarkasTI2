import "server-only";
import { publishRealtime } from "@/libs/realtime/broadcast";

export type AuthRealtimeReason =
  | "USER_UPDATED" | "USER_DELETED" | "ROLE_UPDATED" | "ROLE_DELETED"
  | "PERMISSION_UPDATED" | "PERMISSION_DELETED";

async function invalidateUsers(userIds: string[]) {
  void userIds;
  await publishRealtime("markasti-auth", "session-invalidated", { changed: true });
}

export function broadcastAuthSessionChanged(payload: { targetUserIds: string[]; reason: AuthRealtimeReason; message?: string }) {
  return invalidateUsers(payload.targetUserIds);
}

export function broadcastAuthForceLogout(payload: { targetUserIds: string[]; reason: AuthRealtimeReason; message?: string }) {
  return invalidateUsers(payload.targetUserIds);
}
