import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { canAccess, PERMISSION_SCOPES } from "@/libs/auth/access";
import { prisma } from "@/libs/prisma";

async function allowed(action: "create" | "read" | "update" | "delete") {
  const session = await auth();
  return Boolean(
    session?.user &&
      canAccess(session.user, PERMISSION_SCOPES.attendance, action),
  );
}

function serialize(item: Awaited<ReturnType<typeof prisma.dosenAttendance.findFirst>> & { dosen?: { name: string } }) {
  if (!item) return item;
  return {
    ...item,
    date: item.date.toISOString().slice(0, 10),
    time: item.time ? item.time.toISOString().slice(11, 16) : "",
  };
}

export async function GET() {
  if (!(await allowed("read"))) return Response.json({ ok: false, message: "Tidak diizinkan." }, { status: 403 });
  const data = await prisma.dosenAttendance.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: { dosen: { select: { name: true } } },
  });
  return Response.json({ ok: true, data: data.map(serialize) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const dosenId = Number(body.dosenId);
  const date = new Date(`${body.date}T00:00:00.000Z`);
  const existing = await prisma.dosenAttendance.findUnique({
    where: { dosenId_date: { dosenId, date } },
    select: { id: true },
  });
  if (!(await allowed(existing ? "update" : "create"))) {
    return Response.json({ ok: false, message: "Tidak diizinkan." }, { status: 403 });
  }
  const data = await prisma.dosenAttendance.upsert({
    where: { dosenId_date: { dosenId, date } },
    create: {
      dosenId,
      date,
      time: body.time ? new Date(`1970-01-01T${body.time}:00.000Z`) : null,
      status: body.status,
      note: String(body.note || "") || null,
    },
    update: {
      time: body.time ? new Date(`1970-01-01T${body.time}:00.000Z`) : null,
      status: body.status,
      note: String(body.note || "") || null,
    },
    include: { dosen: { select: { name: true } } },
  });
  return Response.json({ ok: true, data: serialize(data) });
}

export async function DELETE(request: NextRequest) {
  if (!(await allowed("delete"))) return Response.json({ ok: false, message: "Tidak diizinkan." }, { status: 403 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return Response.json({ ok: false, message: "ID wajib diisi." }, { status: 400 });
  await prisma.dosenAttendance.delete({ where: { id } });
  return Response.json({ ok: true });
}
