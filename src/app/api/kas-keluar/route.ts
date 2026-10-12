import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { canAccess, PERMISSION_SCOPES, type PermissionAction } from "@/libs/auth/access";
import { broadcastCashChanged } from "@/libs/cash/realtime";
import { prisma } from "@/libs/prisma";

async function authorize(action: PermissionAction) {
  const session = await auth();
  if (!session?.user) return { response: Response.json({ ok: false, message: "Silakan login." }, { status: 401 }) };
  if (!canAccess(session.user, PERMISSION_SCOPES.cashExpense, action)) {
    return { response: Response.json({ ok: false, message: "Tidak memiliki akses kas keluar." }, { status: 403 }) };
  }
  return { user: session.user };
}

function serialize(item: { id: string; amount: bigint; description: string; category: string; date: Date; createdAt: Date }) {
  return {
    ...item,
    amount: Number(item.amount),
    date: item.date.toISOString().slice(0, 10),
    createdAt: item.createdAt.toISOString(),
  };
}

export async function GET() {
  const access = await authorize("read");
  if (access.response) return access.response;
  const rows = await prisma.kasKeluar.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }] });
  return Response.json({ ok: true, data: rows.map(serialize) });
}

export async function POST(request: NextRequest) {
  const access = await authorize("create");
  if (access.response || !access.user) return access.response;
  const body = await request.json();
  const amount = Math.round(Number(body.amount));
  const description = String(body.description || "").trim();
  const category = String(body.category || "").trim();
  if (!description || !category || !Number.isFinite(amount) || amount <= 0) {
    return Response.json({ ok: false, message: "Kategori, keterangan, dan nominal wajib valid." }, { status: 400 });
  }
  const row = await prisma.kasKeluar.create({
    data: {
      approvedById: access.user.id,
      amount: BigInt(amount),
      description,
      category,
      date: new Date(`${String(body.date)}T00:00:00.000Z`),
    },
  });
  broadcastCashChanged(`OUT:${row.id}`);
  return Response.json({ ok: true, data: serialize(row) }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const access = await authorize("update");
  if (access.response) return access.response;
  const body = await request.json();
  const id = String(body.id || "");
  const row = await prisma.kasKeluar.update({
    where: { id },
    data: {
      amount: BigInt(Math.round(Number(body.amount))),
      description: String(body.description || "").trim(),
      category: String(body.category || "").trim(),
      date: new Date(`${String(body.date)}T00:00:00.000Z`),
    },
  });
  broadcastCashChanged(`OUT:${row.id}`);
  return Response.json({ ok: true, data: serialize(row) });
}

export async function DELETE(request: NextRequest) {
  const access = await authorize("delete");
  if (access.response) return access.response;
  const id = request.nextUrl.searchParams.get("id") || "";
  await prisma.kasKeluar.delete({ where: { id } });
  broadcastCashChanged(`OUT:${id}`);
  return Response.json({ ok: true });
}
