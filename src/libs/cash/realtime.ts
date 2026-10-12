import { RedisRealtimeHub } from "@/libs/realtime/redisHub";

export type CashRealtimeEvent = {
  type: "CASH_CHANGED";
  transactionId: string;
  occurredAt: string;
};

const globalState = globalThis as typeof globalThis & { cashHub?: RedisRealtimeHub<CashRealtimeEvent> };
const hub = globalState.cashHub ?? new RedisRealtimeHub<CashRealtimeEvent>(
  "markasti:realtime:cash",
  (event) => `data: ${JSON.stringify(event)}\n\n`,
);
globalState.cashHub = hub;

export function addCashRealtimeClient(controller: ReadableStreamDefaultController<Uint8Array>) {
  hub.add(crypto.randomUUID(), controller, undefined);
}
export function removeCashRealtimeClient(controller: ReadableStreamDefaultController<Uint8Array>) {
  hub.removeController(controller);
}
export function broadcastCashChanged(transactionId: string) {
  hub.publish({ type: "CASH_CHANGED", transactionId, occurredAt: new Date().toISOString() });
}
