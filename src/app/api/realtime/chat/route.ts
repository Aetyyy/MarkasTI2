import { addChatClient, removeChatClient } from "@/libs/realtime/chat";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const id = crypto.randomUUID();
  let heartbeat: ReturnType<typeof setInterval>;
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      addChatClient(id, controller);
      controller.enqueue(encoder.encode("event: connected\ndata: {}\n\n"));
      heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(": ping\n\n")); } catch { clearInterval(heartbeat); }
      }, 25000);
    },
    cancel() { clearInterval(heartbeat); removeChatClient(id); },
  });
  request.signal.addEventListener("abort", () => { clearInterval(heartbeat); removeChatClient(id); });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } });
}
