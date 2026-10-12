import "server-only";

export type AuthRealtimeReason =
  | "USER_UPDATED"
  | "USER_DELETED"
  | "ROLE_UPDATED"
  | "ROLE_DELETED"
  | "PERMISSION_UPDATED"
  | "PERMISSION_DELETED";

type AuthRealtimeEvent = {
  type: "AUTH_SESSION_CHANGED" | "AUTH_FORCE_LOGOUT";
  reason: AuthRealtimeReason;
  targetUserIds: string[];
  message?: string;
  createdAt: string;
};

type ClientConnection = {
  userId: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
};

const encoder = new TextEncoder();

const globalForRealtime = globalThis as unknown as {
  authRealtimeClients?: Map<string, ClientConnection>;
};

const clients =
  globalForRealtime.authRealtimeClients ?? new Map<string, ClientConnection>();

globalForRealtime.authRealtimeClients = clients;

function sendSseMessage(
  controller: ReadableStreamDefaultController<Uint8Array>,
  event: string,
  data: unknown,
) {
  controller.enqueue(
    encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
  );
}

export function addAuthRealtimeClient(
  userId: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
) {
  const clientId = `${userId}-${crypto.randomUUID()}`;

  clients.set(clientId, {
    userId,
    controller,
  });

  sendSseMessage(controller, "connected", {
    ok: true,
    userId,
    createdAt: new Date().toISOString(),
  });

  return clientId;
}

export function removeAuthRealtimeClient(clientId: string) {
  clients.delete(clientId);
}

export function broadcastAuthSessionChanged(payload: {
  targetUserIds: string[];
  reason: AuthRealtimeReason;
  message?: string;
}) {
  const targetUserIds = new Set(payload.targetUserIds);

  const eventPayload: AuthRealtimeEvent = {
    type: "AUTH_SESSION_CHANGED",
    reason: payload.reason,
    targetUserIds: payload.targetUserIds,
    message: payload.message,
    createdAt: new Date().toISOString(),
  };

  clients.forEach((client, clientId) => {
    if (!targetUserIds.has(client.userId)) return;

    try {
      sendSseMessage(client.controller, "auth-session-changed", eventPayload);
    } catch {
      clients.delete(clientId);
    }
  });
}

export function broadcastAuthForceLogout(payload: {
  targetUserIds: string[];
  reason: AuthRealtimeReason;
  message?: string;
}) {
  const targetUserIds = new Set(payload.targetUserIds);

  const eventPayload: AuthRealtimeEvent = {
    type: "AUTH_FORCE_LOGOUT",
    reason: payload.reason,
    targetUserIds: payload.targetUserIds,
    message: payload.message,
    createdAt: new Date().toISOString(),
  };

  clients.forEach((client, clientId) => {
    if (!targetUserIds.has(client.userId)) return;

    try {
      sendSseMessage(client.controller, "auth-force-logout", eventPayload);
    } catch {
      clients.delete(clientId);
    }
  });
}
