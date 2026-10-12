import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  canAccess,
  PERMISSION_SCOPES,
  type PermissionAction,
} from "@/libs/auth/access";
import { prisma } from "@/libs/prisma";
import { CHANGELOG_TYPES, type ChangelogType } from "@/types/changelog";

async function authorize(action: PermissionAction) {
  const session = await auth();
  if (!session?.user) {
    return {
      response: Response.json(
        { ok: false, message: "Silakan login terlebih dahulu." },
        { status: 401 },
      ),
    };
  }

  if (!canAccess(session.user, PERMISSION_SCOPES.changelogs, action)) {
    return {
      response: Response.json(
        { ok: false, message: "Tidak memiliki permission changelog." },
        { status: 403 },
      ),
    };
  }

  return { user: session.user };
}

function readType(value: unknown): ChangelogType {
  const type = String(value || "IMPROVEMENT") as ChangelogType;
  return CHANGELOG_TYPES.includes(type) ? type : "IMPROVEMENT";
}

function readPayload(body: Record<string, unknown>) {
  const version = String(body.version || "").trim().slice(0, 30);
  const title = String(body.title || "").trim().slice(0, 180);
  const summary = String(body.summary || "").trim().slice(0, 500);
  const details = String(body.details || "").trim() || null;
  const type = readType(body.type);
  const isPublished = Boolean(body.isPublished);
  const sortOrder = Number.isFinite(Number(body.sortOrder))
    ? Math.trunc(Number(body.sortOrder))
    : 0;

  return {
    version,
    title,
    summary,
    details,
    type,
    isPublished,
    sortOrder,
  };
}

function errorResponse(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return Response.json(
      { ok: false, message: "Versi changelog sudah digunakan." },
      { status: 409 },
    );
  }

  console.error(error);
  return Response.json(
    { ok: false, message: "Changelog gagal diproses." },
    { status: 500 },
  );
}

function refreshChangelogs() {
  revalidatePath("/");
  revalidatePath("/admin/changelogs");
}

export async function POST(request: NextRequest) {
  const access = await authorize("create");
  if ("response" in access) return access.response;

  try {
    const payload = readPayload(await request.json());
    if (!payload.version || !payload.title || !payload.summary) {
      return Response.json(
        { ok: false, message: "Versi, judul, dan ringkasan wajib diisi." },
        { status: 400 },
      );
    }

    const item = await prisma.changelog.create({
      data: {
        ...payload,
        authorName: access.user.name || access.user.email || "Admin",
        publishedAt: payload.isPublished ? new Date() : null,
      },
    });

    refreshChangelogs();
    return Response.json({ ok: true, data: item }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  const access = await authorize("update");
  if ("response" in access) return access.response;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = String(body.id || "");
    const payload = readPayload(body);
    if (!id || !payload.version || !payload.title || !payload.summary) {
      return Response.json(
        { ok: false, message: "Data changelog belum lengkap." },
        { status: 400 },
      );
    }

    const current = await prisma.changelog.findUnique({
      where: { id },
      select: { isPublished: true, publishedAt: true },
    });
    if (!current) {
      return Response.json(
        { ok: false, message: "Changelog tidak ditemukan." },
        { status: 404 },
      );
    }

    const item = await prisma.changelog.update({
      where: { id },
      data: {
        ...payload,
        authorName: access.user.name || access.user.email || "Admin",
        publishedAt: payload.isPublished
          ? current.publishedAt || new Date()
          : null,
      },
    });

    refreshChangelogs();
    return Response.json({ ok: true, data: item });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  const access = await authorize("delete");
  if ("response" in access) return access.response;

  try {
    const id = request.nextUrl.searchParams.get("id") || "";
    if (!id) {
      return Response.json(
        { ok: false, message: "ID changelog wajib diisi." },
        { status: 400 },
      );
    }

    await prisma.changelog.delete({ where: { id } });
    refreshChangelogs();
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
