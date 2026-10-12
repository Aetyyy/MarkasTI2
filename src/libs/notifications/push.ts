import "server-only";

import webpush from "web-push";
import { prisma } from "@/libs/prisma";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  type?: "notification" | "task" | "schedule" | "gallery" | "announcement";
  referenceId?: string;
};

export type PushResult = {
  configured: boolean;
  subscriptions: number;
  delivered: number;
  removed: number;
  failed: number;
  errors: Array<{
    provider: "apple" | "google" | "other";
    statusCode: number | null;
    reason: string;
  }>;
};

function validVapidSubject(value: string) {
  if (/^https:\/\/[^\s]+\.[^\s]+$/i.test(value)) return true;
  if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value)) {
    return !value.toLowerCase().endsWith(".local");
  }
  return false;
}

function vapidSubject() {
  const configuredSubject = String(process.env.VAPID_SUBJECT || "").trim();
  return validVapidSubject(configuredSubject)
    ? configuredSubject
    : "https://artenity.my.id";
}

function configured() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(vapidSubject(), publicKey, privateKey);
  return true;
}

function pushProvider(endpoint: string): "apple" | "google" | "other" {
  if (endpoint.includes("push.apple.com")) return "apple";
  if (endpoint.includes("googleapis.com")) return "google";
  return "other";
}

function pushFailureReason(error: unknown) {
  const candidate = error as { body?: unknown; message?: string };
  const body = Buffer.isBuffer(candidate.body)
    ? candidate.body.toString("utf8")
    : String(candidate.body || "");
  try {
    const parsed = JSON.parse(body) as { reason?: string };
    if (parsed.reason) return parsed.reason.slice(0, 100);
  } catch {
    // Respons non-JSON memakai pesan aman di bawah.
  }
  return String(candidate.message || "Push service rejected the request")
    .replace(/https?:\/\/\S+/g, "[push-endpoint]")
    .slice(0, 140);
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  const isConfigured = configured();
  if (!isConfigured || userIds.length === 0) {
    return {
      configured: isConfigured,
      subscriptions: 0,
      delivered: 0,
      removed: 0,
      failed: 0,
      errors: [],
    } satisfies PushResult;
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: Array.from(new Set(userIds)) } },
  });
  let delivered = 0;
  let removed = 0;
  let failed = 0;
  const errors: PushResult["errors"] = [];

  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        JSON.stringify(payload),
        { TTL: 60 * 60, urgency: "high" },
      );
      delivered += 1;
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if ([404, 410].includes(statusCode || 0)) {
        await prisma.pushSubscription.delete({ where: { endpoint: subscription.endpoint } }).catch(() => undefined);
        removed += 1;
      } else {
        failed += 1;
        if (errors.length < 5) {
          errors.push({
            provider: pushProvider(subscription.endpoint),
            statusCode: statusCode || null,
            reason: pushFailureReason(error),
          });
        }
      }
    }
  }));

  return {
    configured: true,
    subscriptions: subscriptions.length,
    delivered,
    removed,
    failed,
    errors,
  } satisfies PushResult;
}
