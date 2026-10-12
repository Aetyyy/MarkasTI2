import { NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  canAccess,
  ADMIN_ROUTE_ACCESS,
  isSuperAdminRole,
  PERMISSION_SCOPES,
  type PermissionAction,
} from "@/libs/auth/access";
import { ensureNavigationDefaults } from "@/libs/navigation/defaults";
import { prisma } from "@/libs/prisma";

function unauthorized(message = "Tidak diizinkan.", status = 403) {
  return Response.json({ ok: false, message }, { status });
}

async function requireNavigationManager(action: PermissionAction) {
  const session = await auth();
  if (!session?.user) return null;

  const allowed = canAccess(
    session.user,
    PERMISSION_SCOPES.navigation,
    action,
  );

  return allowed ? session.user : null;
}

const itemInclude = {
  requiredScope: { select: { id: true, name: true } },
  roles: { select: { id: true, name: true } },
  allowedUsers: { select: { id: true, name: true, nim: true } },
} as const;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized("Silakan login terlebih dahulu.", 401);

  await ensureNavigationDefaults();
  const manage = request.nextUrl.searchParams.get("manage") === "1";

  if (manage) {
    const manager = await requireNavigationManager("read");
    if (!manager) return unauthorized();
  }

  const categories = await prisma.sidebarCategory.findMany({
    where: manage ? undefined : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    include: {
      items: {
        where: manage ? undefined : { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
        include: itemInclude,
      },
    },
  });

  const superAdmin = isSuperAdminRole(session.user.roles);
  const roleIds = new Set(session.user.roleIds || []);

  const visibleCategories = categories
    .map((category) => ({
      ...category,
      items: manage
        ? category.items
        : category.items.filter((item) => {
            if (superAdmin) return true;

            const routeAccess = ADMIN_ROUTE_ACCESS.find(
              (route) => route.href === item.href,
            );

            if (
              routeAccess &&
              !canAccess(session.user, routeAccess.scope, "read")
            ) {
              return false;
            }

            const directUser = item.allowedUsers.some(
              (user) => user.id === session.user.id,
            );
            const roleMatch = item.roles.some((role) => roleIds.has(role.id));
            const permissionMatch = item.requiredScope
              ? canAccess(
                  session.user,
                  item.requiredScope.name,
                  (item.requiredAction || "read") as PermissionAction,
                )
              : false;
            const unrestricted =
              item.roles.length === 0 &&
              item.allowedUsers.length === 0 &&
              !item.requiredScope;

            return unrestricted || directUser || roleMatch || permissionMatch;
          }),
    }))
    .filter((category) => manage || category.items.length > 0);

  const metadata = manage
    ? await Promise.all([
        prisma.roles.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
        prisma.permissionScope.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
        prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, nim: true } }),
      ])
    : null;

  return Response.json({
    ok: true,
    data: visibleCategories,
    ...(metadata
      ? { roles: metadata[0], scopes: metadata[1], users: metadata[2] }
      : {}),
  });
}

export async function POST(request: NextRequest) {
  const manager = await requireNavigationManager("create");
  if (!manager) return unauthorized();

  const body = await request.json();
  if (body.type === "category") {
    const title = String(body.title || "").trim();
    if (!title) return unauthorized("Nama kategori wajib diisi.", 400);

    const category = await prisma.sidebarCategory.create({
      data: {
        title,
        icon: String(body.icon || "layers"),
        sortOrder: Number(body.sortOrder) || 0,
      },
    });
    return Response.json({ ok: true, category });
  }

  const label = String(body.label || "").trim();
  const href = String(body.href || "").trim();
  if (!label || !href.startsWith("/")) {
    return unauthorized("Label dan href internal wajib diisi.", 400);
  }

  const item = await prisma.sidebarItem.create({
    data: {
      label,
      description: String(body.description || ""),
      href,
      icon: String(body.icon || "layers"),
      badge: body.badge ? String(body.badge) : null,
      sortOrder: Number(body.sortOrder) || 0,
      categoryId: String(body.categoryId),
      requiredScopeId: body.requiredScopeId || null,
      requiredAction: body.requiredScopeId ? String(body.requiredAction || "read") : null,
      roles: { connect: (body.roleIds || []).map((id: string) => ({ id })) },
      allowedUsers: { connect: (body.userIds || []).map((id: string) => ({ id })) },
    },
    include: itemInclude,
  });

  return Response.json({ ok: true, item });
}

export async function PATCH(request: NextRequest) {
  const manager = await requireNavigationManager("update");
  if (!manager) return unauthorized();
  const body = await request.json();

  if (body.type === "category") {
    const category = await prisma.sidebarCategory.update({
      where: { id: String(body.id) },
      data: {
        title: String(body.title || "").trim(),
        icon: String(body.icon || "layers"),
        sortOrder: Number(body.sortOrder) || 0,
        isActive: body.isActive !== false,
      },
    });
    return Response.json({ ok: true, category });
  }

  const item = await prisma.sidebarItem.update({
    where: { id: String(body.id) },
    data: {
      label: String(body.label || "").trim(),
      description: String(body.description || ""),
      href: String(body.href || "").trim(),
      icon: String(body.icon || "layers"),
      badge: body.badge ? String(body.badge) : null,
      sortOrder: Number(body.sortOrder) || 0,
      isActive: body.isActive !== false,
      categoryId: String(body.categoryId),
      requiredScopeId: body.requiredScopeId || null,
      requiredAction: body.requiredScopeId ? String(body.requiredAction || "read") : null,
      roles: { set: (body.roleIds || []).map((id: string) => ({ id })) },
      allowedUsers: { set: (body.userIds || []).map((id: string) => ({ id })) },
    },
    include: itemInclude,
  });

  return Response.json({ ok: true, item });
}

export async function DELETE(request: NextRequest) {
  const manager = await requireNavigationManager("delete");
  if (!manager) return unauthorized();
  const body = await request.json();

  if (body.type === "category") {
    await prisma.sidebarCategory.delete({ where: { id: String(body.id) } });
  } else {
    await prisma.sidebarItem.delete({ where: { id: String(body.id) } });
  }

  return Response.json({ ok: true });
}
