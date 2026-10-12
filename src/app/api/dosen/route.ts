import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { canAccess, PERMISSION_SCOPES } from "@/libs/auth/access";
import { prisma } from "@/libs/prisma";

async function access(action: "create" | "read") {
  const session = await auth();
  if (!session?.user) return null;
  return canAccess(session.user, PERMISSION_SCOPES.dosen, action)
    ? session.user
    : null;
}

export async function GET() {
  if (!(await access("read"))) return Response.json({ ok: false, message: "Tidak diizinkan." }, { status: 403 });
  const data = await prisma.dosen.findMany({
    orderBy: { name: "asc" },
    include: {
      mataKuliah: {
        include: { mataKuliah: { select: { id: true, code: true, name: true, sks: true } } },
      },
    },
  });
  return Response.json({ ok: true, data });
}

export async function POST(request: NextRequest) {
  if (!(await access("create"))) return Response.json({ ok: false, message: "Tidak diizinkan." }, { status: 403 });
  const body = await request.json();
  const name = String(body.name || "").trim();
  const mataKuliahIds = Array.isArray(body.mataKuliahIds)
    ? body.mataKuliahIds.map(Number).filter(Number.isInteger)
    : [];
  if (!name) return Response.json({ ok: false, message: "Nama dosen wajib diisi." }, { status: 400 });
  const data = await prisma.dosen.create({
    data: {
      name,
      nip: String(body.nip || "").trim() || null,
      email: String(body.email || "").trim() || null,
      phone: String(body.phone || "").trim() || null,
      address: String(body.address || "").trim() || null,
      mataKuliah: {
        create: mataKuliahIds.map((mataKuliahId: number) => ({ mataKuliahId })),
      },
    },
    include: { mataKuliah: { include: { mataKuliah: true } } },
  });
  return Response.json({ ok: true, data });
}
