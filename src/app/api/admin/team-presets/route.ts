import { auth } from "@/auth";
import { prisma } from "@/libs/prisma";
import { canAccess, PERMISSION_SCOPES } from "@/libs/auth/access";
import { isVercelBlobUrl } from "@/libs/vercelBlob";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json(
      { ok: false, message: "Belum login." },
      { status: 401 },
    );
  }

  if (!canAccess(session.user, PERMISSION_SCOPES.teams, "create")) {
    return Response.json(
      { ok: false, message: "Tidak punya izin membuat preset team." },
      { status: 403 },
    );
  }

  const body = (await request.json()) as {
    code?: string;
    name?: string;
    logoUrl?: string | null;
  };

  const code = String(body.code ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 20);
  const name = String(body.name ?? "")
    .trim()
    .slice(0, 100);
  const logoUrl = String(body.logoUrl ?? "").trim() || null;

  if (!code || !name) {
    return Response.json(
      { ok: false, message: "Code dan nama preset wajib diisi." },
      { status: 400 },
    );
  }

  if (logoUrl && !isVercelBlobUrl(logoUrl, "team")) {
    return Response.json(
      { ok: false, message: "URL logo preset tidak valid." },
      { status: 400 },
    );
  }

  try {
    const preset = await prisma.teamIdentityPreset.create({
      data: { code, name, logoUrl },
      select: { id: true, code: true, name: true, logoUrl: true },
    });

    return Response.json({
      ok: true,
      message: "Preset team berhasil dibuat.",
      preset,
    });
  } catch {
    return Response.json(
      { ok: false, message: "Code preset sudah digunakan." },
      { status: 409 },
    );
  }
}
