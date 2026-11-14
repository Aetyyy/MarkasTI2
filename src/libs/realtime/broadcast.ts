import "server-only";

let warned = false;

export async function publishRealtime(topic: string, event: string, payload: unknown): Promise<void> {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    if (!warned) {
      warned = true;
      console.warn("[realtime] Supabase Realtime is not configured; client polling/focus refresh remains available.");
    }
    return;
  }
  try {
    const endpoint = `${url.replace(/\/$/, "")}/realtime/v1/api/broadcast/${encodeURIComponent(topic)}/events/${encodeURIComponent(event)}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok && !warned) {
      warned = true;
      console.warn(`[realtime] Supabase broadcast returned HTTP ${response.status}.`);
    }
  } catch (error) {
    if (!warned) {
      warned = true;
      console.warn("[realtime] Supabase broadcast failed; database remains the source of truth.", error);
    }
  }
}
