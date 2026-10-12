import "server-only";

import { prisma } from "@/libs/prisma";
import type { SessionPermission } from "@/types/nextAuth";

export type AuthUserPayload = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  nim: string;
  roles: string[];
  roleIds: string[];
  permissions: SessionPermission[];
  isActive: boolean;
};

type CacheEntry = {
  expiresAt: number;
  payload: AuthUserPayload | null;
};

type InFlightEntry = {
  version: number;
  promise: Promise<AuthUserPayload | null>;
};

type AuthPayloadCache = {
  entries: Map<string, CacheEntry>;
  inFlight: Map<string, InFlightEntry>;
  versions: Map<string, number>;
};

const CACHE_TTL_MS = 45_000;
const CACHE_MAX_ENTRIES = 500;
const globalForAuthCache = globalThis as typeof globalThis & {
  __markasAuthPayloadCache?: AuthPayloadCache;
};

const cache =
  globalForAuthCache.__markasAuthPayloadCache ??
  (globalForAuthCache.__markasAuthPayloadCache = {
    entries: new Map(),
    inFlight: new Map(),
    versions: new Map(),
  });

function getSafeSessionImage(image?: string | null) {
  if (!image) return null;

  const cleanImage = image.trim();
  if (!cleanImage || cleanImage.startsWith("data:")) return null;
  if (cleanImage.startsWith("prototype://")) return null;

  return cleanImage;
}

function mergePermission(
  map: Map<string, SessionPermission>,
  permission: SessionPermission,
) {
  const existing = map.get(permission.scopeId);

  if (!existing) {
    map.set(permission.scopeId, permission);
    return;
  }

  map.set(permission.scopeId, {
    scopeId: permission.scopeId,
    name: permission.name,
    create: existing.create || permission.create,
    read: existing.read || permission.read,
    update: existing.update || permission.update,
    delete: existing.delete || permission.delete,
  });
}

function copyPayload(payload: AuthUserPayload | null) {
  if (!payload) return null;

  return {
    ...payload,
    roles: [...payload.roles],
    roleIds: [...payload.roleIds],
    permissions: payload.permissions.map((permission) => ({ ...permission })),
  };
}

async function queryAuthUserPayload(
  userId: string,
): Promise<AuthUserPayload | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      nim: true,
      email: true,
      image: true,
      roles: {
        select: {
          id: true,
          name: true,
          rolePermissions: {
            select: {
              canCreate: true,
              canRead: true,
              canUpdate: true,
              canDelete: true,
              scope: { select: { id: true, name: true } },
            },
          },
        },
      },
      userPermissions: {
        select: {
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
          scope: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!user) return null;

  const permissionMap = new Map<string, SessionPermission>();

  user.roles.forEach((role) => {
    role.rolePermissions.forEach((permission) => {
      mergePermission(permissionMap, {
        scopeId: permission.scope.id,
        name: permission.scope.name,
        create: permission.canCreate,
        read: permission.canRead,
        update: permission.canUpdate,
        delete: permission.canDelete,
      });
    });
  });

  user.userPermissions.forEach((permission) => {
    mergePermission(permissionMap, {
      scopeId: permission.scope.id,
      name: permission.scope.name,
      create: permission.canCreate,
      read: permission.canRead,
      update: permission.canUpdate,
      delete: permission.canDelete,
    });
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: getSafeSessionImage(user.image),
    nim: user.nim,
    roles: user.roles.map((role) => role.name),
    roleIds: user.roles.map((role) => role.id),
    permissions: Array.from(permissionMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    isActive: true,
  };
}

export async function getAuthUserPayload(
  userId: string,
): Promise<AuthUserPayload | null> {
  if (!userId) return null;

  const now = Date.now();
  const cached = cache.entries.get(userId);
  if (cached && cached.expiresAt > now) {
    // Map insertion order is used as the LRU order.
    cache.entries.delete(userId);
    cache.entries.set(userId, cached);
    return copyPayload(cached.payload);
  }
  if (cached) cache.entries.delete(userId);

  const version = cache.versions.get(userId) ?? 0;
  const existing = cache.inFlight.get(userId);
  if (existing?.version === version) {
    const payload = await existing.promise;
    return version === (cache.versions.get(userId) ?? 0)
      ? copyPayload(payload)
      : getAuthUserPayload(userId);
  }

  const promise = queryAuthUserPayload(userId);
  cache.inFlight.set(userId, { version, promise });

  try {
    const payload = await promise;
    if (version !== (cache.versions.get(userId) ?? 0)) {
      return getAuthUserPayload(userId);
    }

    cache.entries.delete(userId);
    cache.entries.set(userId, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      payload,
    });

    while (cache.entries.size > CACHE_MAX_ENTRIES) {
      const oldestUserId = cache.entries.keys().next().value;
      if (!oldestUserId) break;
      cache.entries.delete(oldestUserId);
    }

    return copyPayload(payload);
  } finally {
    if (cache.inFlight.get(userId)?.promise === promise) {
      cache.inFlight.delete(userId);
    }
    if (!cache.inFlight.has(userId)) cache.versions.delete(userId);
  }
}

export function invalidateAuthUserPayload(userId: string) {
  if (!userId) return;

  cache.entries.delete(userId);
  const inFlight = cache.inFlight.get(userId);
  if (inFlight) {
    cache.versions.set(userId, inFlight.version + 1);
  } else {
    cache.versions.delete(userId);
  }
}

export function invalidateAuthUserPayloads(userIds: string[]) {
  for (const userId of new Set(userIds.filter(Boolean))) {
    invalidateAuthUserPayload(userId);
  }
}
