import "server-only";
import { publishRealtime } from "@/libs/realtime/broadcast";

export type CashRealtimeEvent = { type: "CASH_CHANGED"; transactionId: string; occurredAt: string };

export function broadcastCashChanged(transactionId: string) {
  void transactionId;
  // Do not expose transaction data on a public broadcast topic.
  return publishRealtime("markasti-cash", "cash-invalidated", { changed: true });
}
