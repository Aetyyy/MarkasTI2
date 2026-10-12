import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { canAccess, PERMISSION_SCOPES, type PermissionAction } from "@/libs/auth/access";
import { broadcastCashChanged } from "@/libs/cash/realtime";
import { prisma } from "@/libs/prisma";

async function authorize(action: PermissionAction) {
  const session = await auth();
  if (!session?.user) return { response: Response.json({ ok: false, message: "Silakan login." }, { status: 401 }) };
  if (!canAccess(session.user, PERMISSION_SCOPES.cashIncome, action)) {
    return { response: Response.json({ ok: false, message: "Tidak memiliki akses kas masuk." }, { status: 403 }) };
  }
  return { user: session.user };
}

function serialize(item: { id: string; amount: bigint; description: string; paymentMethod: string; qrcodeData: string | null; date: Date; createdAt: Date }) {
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
  const rows = await prisma.kasMasuk.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }] });
  return Response.json({ ok: true, data: rows.map(serialize) });
}

export async function POST(request: NextRequest) {
  const access = await authorize("create");
  if (access.response || !access.user) return access.response;
  const body = await request.json();
  const amount = Math.round(Number(body.amount));
  const description = String(body.description || "").trim();
  if (!description || !Number.isFinite(amount) || amount <= 0) {
    return Response.json({ ok: false, message: "Keterangan dan nominal wajib valid." }, { status: 400 });
  }
  const row = await prisma.kasMasuk.create({
    data: {
      paidById: access.user.id,
      payerName: access.user.name || "Admin",
      payerNim: access.user.nim || "-",
      amount: BigInt(amount),
      description,
      paymentMethod: String(body.paymentMethod || "cash"),
      qrcodeData: String(body.qrcodeData || "") || null,
      date: new Date(`${String(body.date)}T00:00:00.000Z`),
    },
  });
  broadcastCashChanged(`IN:${row.id}`);
  return Response.json({ ok: true, data: serialize(row) }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const access = await authorize("update");
  if (access.response) return access.response;
  const body = await request.json();
  const id = String(body.id || "");
  const amount = Math.round(Number(body.amount));
  const row = await prisma.kasMasuk.update({
    where: { id },
    data: {
      amount: BigInt(amount),
      description: String(body.description || "").trim(),
      paymentMethod: String(body.paymentMethod || "cash"),
      date: new Date(`${String(body.date)}T00:00:00.000Z`),
    },
  });
  broadcastCashChanged(`IN:${row.id}`);
  return Response.json({ ok: true, data: serialize(row) });
}

export async function DELETE(request: NextRequest) {
  const access = await authorize("delete");
  if (access.response) return access.response;
  const id = request.nextUrl.searchParams.get("id") || "";
  await prisma.kasMasuk.delete({ where: { id } });
  broadcastCashChanged(`IN:${id}`);
  return Response.json({ ok: true });
}
