import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { canAccess, PERMISSION_SCOPES } from "@/libs/auth/access";
import { prisma } from "@/libs/prisma";

async function allowed(action: "update" | "delete") {
  const session = await auth();
  return Boolean(
    session?.user &&
      canAccess(session.user, PERMISSION_SCOPES.dosen, action),
  );
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await allowed("update"))) return Response.json({ ok: false, message: "Tidak diizinkan." }, { status: 403 });
  const { id } = await context.params;
  const body = await request.json();
  const mataKuliahIds = Array.isArray(body.mataKuliahIds)
    ? body.mataKuliahIds.map(Number).filter(Number.isInteger)
    : [];
  const data = await prisma.dosen.update({
    where: { id: Number(id) },
    data: {
      name: String(body.name || "").trim(),
      nip: String(body.nip || "").trim() || null,
      email: String(body.email || "").trim() || null,
      phone: String(body.phone || "").trim() || null,
      address: String(body.address || "").trim() || null,
      mataKuliah: {
        deleteMany: {},
        create: mataKuliahIds.map((mataKuliahId: number) => ({ mataKuliahId })),
      },
    },
    include: { mataKuliah: { include: { mataKuliah: true } } },
  });
  return Response.json({ ok: true, data });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await allowed("delete"))) return Response.json({ ok: false, message: "Tidak diizinkan." }, { status: 403 });
  const { id } = await context.params;
  await prisma.dosen.delete({ where: { id: Number(id) } });
  return Response.json({ ok: true });
}
