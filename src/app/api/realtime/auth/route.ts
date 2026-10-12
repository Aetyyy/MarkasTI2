import { auth } from "@/auth";
import {
  addAuthRealtimeClient,
  removeAuthRealtimeClient,
} from "@/libs/realtime/authRealtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const encoder = new TextEncoder();

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  const userId = session.user.id;

  let clientId = "";
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (heartbeat) clearInterval(heartbeat);
    if (clientId) removeAuthRealtimeClient(clientId);
  };
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      clientId = addAuthRealtimeClient(userId, controller);
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`event: heartbeat\ndata: {}\n\n`));
        } catch {
          cleanup();
        }
      }, 25_000);
      request.signal.addEventListener("abort", cleanup, { once: true });
    },

    cancel: cleanup,
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
