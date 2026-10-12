import type { DefaultSession } from "next-auth";

export type SessionPermission = {
  scopeId: string;
  name: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
};

declare module "next-auth" {
  interface User {
    id: string;
    nim: string;
    roles: string[];
    roleIds: string[];
    permissions: SessionPermission[];
    isActive: boolean;
  }

  interface Session {
    user: {
      id: string;
      nim: string;
      roles: string[];
      roleIds: string[];
      permissions: SessionPermission[];
      isActive: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    nim?: string;
    roles?: string[];
    roleIds?: string[];
    permissions?: SessionPermission[];
    isActive?: boolean;
  }
}
