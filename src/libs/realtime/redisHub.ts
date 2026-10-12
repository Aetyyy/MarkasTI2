import "server-only";

import { Redis } from "@upstash/redis";

type Controller = ReadableStreamDefaultController<Uint8Array>;
type Client<TMeta> = { controller: Controller; meta: TMeta };
type Envelope<T> = { source: string; payload: T };

const encoder = new TextEncoder();
const processId = crypto.randomUUID();
const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
const redis = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken, automaticDeserialization: false })
  : null;

/** One local SSE fan-out per process, backed by Upstash Pub/Sub when configured. */
export class RedisRealtimeHub<T, TMeta = undefined> {
  private readonly clients = new Map<string, Client<TMeta>>();
  private subscriber: ReturnType<Redis["subscribe"]> | null = null;
  private subscribing = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private warned = false;

  constructor(
    private readonly channel: string,
    private readonly format: (payload: T, meta: TMeta) => string,
    private readonly matches: (payload: T, meta: TMeta) => boolean = () => true,
  ) {}

  add(id: string, controller: Controller, meta: TMeta): void {
    this.clients.set(id, { controller, meta });
    this.ensureSubscriber();
  }

  remove(id: string): void {
    this.clients.delete(id);
    if (this.clients.size === 0) {
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
      const subscriber = this.subscriber;
      this.subscriber = null;
      if (subscriber) void subscriber.unsubscribe([this.channel]).catch(() => {});
    }
  }

  removeController(controller: Controller): void {
    for (const [id, client] of this.clients) {
      if (client.controller === controller) this.remove(id);
    }
  }

  publish(payload: T): void {
    // Keep local development and transient Redis outages useful.
    if (!redis) {
      this.deliver(payload);
      return;
    }

    // Deliver on this process immediately; the source marker prevents the
    // Pub/Sub echo from sending the same event twice to local SSE clients.
    this.deliver(payload);
    void redis.publish(this.channel, JSON.stringify({ source: processId, payload } satisfies Envelope<T>))
      .catch((error: unknown) => this.warnOnce("publish", error));
    this.ensureSubscriber();
  }

  private ensureSubscriber(): void {
    if (!redis || this.subscribing || this.subscriber || this.clients.size === 0) return;
    this.subscribing = true;
    try {
      const subscriber = redis.subscribe<string>(this.channel);
      this.subscriber = subscriber;
      subscriber.on("subscribe", () => { this.reconnectAttempts = 0; });
      subscriber.on("message", ({ message }) => {
        try {
          const envelope = JSON.parse(message) as Envelope<T>;
          if (envelope.source !== processId && envelope.payload !== undefined) this.deliver(envelope.payload);
        } catch (error) {
          this.warnOnce("message", error);
        }
      });
      subscriber.on("error", (error) => {
        this.warnOnce("subscribe", error);
        if (this.subscriber === subscriber) {
          this.subscriber = null;
          void subscriber.unsubscribe([this.channel]).catch(() => {});
        }
        this.scheduleReconnect();
      });
    } catch (error) {
      this.warnOnce("subscribe", error);
      this.scheduleReconnect();
    } finally {
      this.subscribing = false;
    }
  }

  private scheduleReconnect(): void {
    if (!redis || this.clients.size === 0 || this.reconnectTimer) return;
    const delay = Math.min(30_000, 500 * 2 ** Math.min(this.reconnectAttempts, 6));
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.ensureSubscriber();
    }, delay);
  }

  private deliver(payload: T): void {
    for (const [id, client] of this.clients) {
      if (!this.matches(payload, client.meta)) continue;
      try {
        client.controller.enqueue(encoder.encode(this.format(payload, client.meta)));
      } catch {
        this.remove(id);
      }
    }
  }

  private warnOnce(operation: string, error: unknown): void {
    if (this.warned) return;
    this.warned = true;
    console.warn(`[realtime:${this.channel}] Redis ${operation} failed; local SSE delivery remains active.`, error);
  }
}
