import {
  addGalleryRealtimeClient,
  removeGalleryRealtimeClient,
} from "@/libs/gallery/realtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const encoder = new TextEncoder();

export async function GET() {
  let clientId = "";
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      clientId = addGalleryRealtimeClient(controller);

      heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(
              `event: heartbeat\ndata: ${JSON.stringify({
                ok: true,
                at: new Date().toISOString(),
              })}\n\n`,
            ),
          );
        } catch {
          if (heartbeat) clearInterval(heartbeat);
          if (clientId) removeGalleryRealtimeClient(clientId);
        }
      }, 25_000);
    },

    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      if (clientId) removeGalleryRealtimeClient(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
