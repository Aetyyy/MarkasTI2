import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { canAccess, PERMISSION_SCOPES } from "@/libs/auth/access";
import { prisma } from "@/libs/prisma";

async function allowed(action: "create" | "read" | "update" | "delete") {
  const session = await auth();
  return Boolean(
    session?.user &&
      canAccess(session.user, PERMISSION_SCOPES.dosen, action),
  );
}

export async function GET() {
  if (!(await allowed("read"))) {
    return Response.json({ ok: false, message: "Tidak diizinkan." }, { status: 403 });
  }

  const data = await prisma.mataKuliah.findMany({
    orderBy: [{ name: "asc" }],
    include: {
      dosen: { include: { dosen: { select: { id: true, name: true } } } },
      _count: { select: { jadwal: true } },
    },
  });
  return Response.json({ ok: true, data });
}

export async function POST(request: NextRequest) {
  if (!(await allowed("create"))) {
    return Response.json({ ok: false, message: "Tidak diizinkan." }, { status: 403 });
  }

  const body = await request.json();
  const code = String(body.code || "").trim().toUpperCase();
  const name = String(body.name || "").trim();
  const sks = Math.min(8, Math.max(1, Number(body.sks) || 2));
  if (!code || !name) {
    return Response.json({ ok: false, message: "Kode dan nama mata kuliah wajib diisi." }, { status: 400 });
  }

  const data = await prisma.mataKuliah.create({ data: { code, name, sks } });
  return Response.json({ ok: true, data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!(await allowed("update"))) {
    return Response.json({ ok: false, message: "Tidak diizinkan." }, { status: 403 });
  }

  const body = await request.json();
  const id = Number(body.id);
  const data = await prisma.mataKuliah.update({
    where: { id },
    data: {
      code: String(body.code || "").trim().toUpperCase(),
      name: String(body.name || "").trim(),
      sks: Math.min(8, Math.max(1, Number(body.sks) || 2)),
      isActive: body.isActive !== false,
    },
  });
  return Response.json({ ok: true, data });
}

export async function DELETE(request: NextRequest) {
  if (!(await allowed("delete"))) {
    return Response.json({ ok: false, message: "Tidak diizinkan." }, { status: 403 });
  }

  const id = Number(request.nextUrl.searchParams.get("id"));
  await prisma.mataKuliah.delete({ where: { id } });
  return Response.json({ ok: true });
}
