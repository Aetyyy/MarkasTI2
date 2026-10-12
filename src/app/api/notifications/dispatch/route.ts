import { auth } from "@/auth";
import { prisma } from "@/libs/prisma";
import { sendPushToUsers } from "@/libs/notifications/push";
import { broadcastNotification } from "@/libs/realtime/notifications";
import { sendScheduleReminderEmail } from "@/libs/mail";
import { canAccess, PERMISSION_SCOPES } from "@/libs/auth/access";

const dayMap: Record<
  string,
  "SENIN" | "SELASA" | "RABU" | "KAMIS" | "JUMAT" | "SABTU" | null
> = {
  Monday: "SENIN",
  Tuesday: "SELASA",
  Wednesday: "RABU",
  Thursday: "KAMIS",
  Friday: "JUMAT",
  Saturday: "SABTU",
  Sunday: null,
};

function jakartaNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value || "";
  return {
    day: dayMap[value("weekday")],
    date: `${value("year")}-${value("month")}-${value("day")}`,
    minutes: Number(value("hour")) * 60 + Number(value("minute")),
  };
}

async function dispatchNotifications(request: Request) {
  const session = await auth();
  const secret = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  const validCron = Boolean(
    process.env.CRON_SECRET && secret === process.env.CRON_SECRET,
  );
  const allowedUser = Boolean(
    session?.user &&
    canAccess(session.user, PERMISSION_SCOPES.schedules, "update"),
  );
  if (!validCron && !allowedUser) {
    return Response.json(
      { ok: false, message: "Tidak memiliki izin mengirim notifikasi jadwal." },
      { status: session?.user ? 403 : 401 },
    );
  }
  const now = jakartaNow();
  if (!now.day) return Response.json({ ok: true, dispatched: 0 });
  const schedules = await prisma.jadwal.findMany({
    where: { day: now.day, isActive: true },
  });
  const due = schedules.filter((schedule) => {
    const [hour, minute] = schedule.startTime.split(":").map(Number);
    const difference = hour * 60 + minute - now.minutes;
    return difference > 0 && difference <= 60;
  });
  if (due.length === 0) return Response.json({ ok: true, dispatched: 0 });
  const users = await prisma.user.findMany({
    where: { taskReminder: true },
    select: { id: true, name: true, email: true, emailNotification: true },
  });
  let dispatched = 0;
  for (const schedule of due) {
    const [hour, minute] = schedule.startTime.split(":").map(Number);
    const scheduledFor = new Date(
      `${now.date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+07:00`,
    );
    const recipients: string[] = [];
    for (const user of users) {
      try {
        await prisma.notificationDispatch.create({
          data: {
            userId: user.id,
            type: "schedule",
            referenceId: String(schedule.id),
            scheduledFor,
          },
        });
        await prisma.userNotification.create({
          data: {
            userId: user.id,
            type: "schedule",
            title: "Kuliah dimulai 1 jam lagi",
            body: `${schedule.title} pukul ${schedule.startTime}${schedule.location ? ` di ${schedule.location}` : ""}`,
            url: "/schedules",
            referenceId: String(schedule.id),
          },
        });
        recipients.push(user.id);
        dispatched += 1;
      } catch {
        /* unique dispatch berarti sudah pernah dikirim */
      }
    }
    if (recipients.length) {
      const payload = {
        type: "schedule" as const,
        title: "Kuliah dimulai 1 jam lagi",
        body: `${schedule.title} pukul ${schedule.startTime}${schedule.location ? ` di ${schedule.location}` : ""}`,
        url: "/schedules",
        tag: `schedule-${schedule.id}-${now.date}`,
        referenceId: String(schedule.id),
      };
      broadcastNotification(
        payload,
        recipients,
      );
      await sendPushToUsers(recipients, payload);
      const recipientSet = new Set(recipients);
      await Promise.allSettled(
        users
          .filter(
            (user) =>
              recipientSet.has(user.id) && user.emailNotification && user.email,
          )
          .map((user) =>
            sendScheduleReminderEmail({
              to: user.email,
              name: user.name,
              course: schedule.title,
              startTime: schedule.startTime,
              location: schedule.location,
            }),
          ),
      );
    }
  }
  return Response.json({ ok: true, dispatched });
}

export const POST = dispatchNotifications;
export const GET = dispatchNotifications;
