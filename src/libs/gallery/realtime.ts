import "server-only";
import type { GalleryRealtimeEvent } from "@/types/gallery";
import { publishRealtime } from "@/libs/realtime/broadcast";

export function broadcastGalleryRealtime(payload: GalleryRealtimeEvent) {
  void payload;
  return publishRealtime("markasti-gallery", "gallery-event", { changed: true });
}
