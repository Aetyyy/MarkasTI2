import { auth } from "@/auth";
import { canAccess, PERMISSION_SCOPES } from "@/libs/auth/access";
import { prisma } from "@/libs/prisma";
import { cacheDatabaseRead } from "@/libs/serverCache";

export async function GET() {
  const session = await auth();
  const allowed = Boolean(
    session?.user &&
      canAccess(session.user, PERMISSION_SCOPES.attendance, "read"),
  );

  if (!allowed) {
    return Response.json(
      { ok: false, message: "Tidak diizinkan." },
      { status: 403 },
    );
  }

  const data = await cacheDatabaseRead("attendance-dosen-options", () => prisma.dosen.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  }), 30);

  return Response.json({ ok: true, data });
}
