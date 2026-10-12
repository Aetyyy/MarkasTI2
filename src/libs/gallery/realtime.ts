import "server-only";

import type { GalleryRealtimeEvent } from "@/types/gallery";
import { RedisRealtimeHub } from "@/libs/realtime/redisHub";

const globalState = globalThis as typeof globalThis & {
  galleryHub?: RedisRealtimeHub<GalleryRealtimeEvent>;
};
const hub = globalState.galleryHub ?? new RedisRealtimeHub<GalleryRealtimeEvent>(
  "markasti:realtime:gallery",
  (payload) => `event: gallery-event\ndata: ${JSON.stringify(payload)}\n\n`,
);
globalState.galleryHub = hub;

export function addGalleryRealtimeClient(controller: ReadableStreamDefaultController<Uint8Array>) {
  const clientId = crypto.randomUUID();
  hub.add(clientId, controller, undefined);
  try {
    controller.enqueue(new TextEncoder().encode(`event: connected\ndata: ${JSON.stringify({ ok: true, createdAt: new Date().toISOString() })}\n\n`));
  } catch {
    hub.remove(clientId);
  }
  return clientId;
}

export function removeGalleryRealtimeClient(clientId: string) { hub.remove(clientId); }
export function broadcastGalleryRealtime(payload: GalleryRealtimeEvent) { hub.publish(payload); }
