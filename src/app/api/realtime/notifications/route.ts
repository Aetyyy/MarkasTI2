import { auth } from "@/auth";
import { addNotificationClient, removeNotificationClient } from "@/libs/realtime/notifications";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { ok: false, message: "Silakan login terlebih dahulu." },
      { status: 401 },
    );
  }
  const id = crypto.randomUUID();
  let heartbeat: ReturnType<typeof setInterval>;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      addNotificationClient(id, { userId: session.user.id, controller });
      controller.enqueue(new TextEncoder().encode("event: connected\ndata: {}\n\n"));
      heartbeat = setInterval(() => {
        try { controller.enqueue(new TextEncoder().encode(": ping\n\n")); } catch { clearInterval(heartbeat); }
      }, 25000);
    },
    cancel() {
      clearInterval(heartbeat);
      removeNotificationClient(id);
    },
  });

  request.signal.addEventListener("abort", () => {
    clearInterval(heartbeat);
    removeNotificationClient(id);
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
