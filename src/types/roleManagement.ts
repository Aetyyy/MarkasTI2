export type PermissionForClient = {
  id: string;
  scopeId: string;
  name: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
};

export type RoleWithPermissionsForClient = {
  id: string;
  name: string;
  permissions: PermissionForClient[];
};

export type PermissionScopeOption = {
  id: string;
  name: string;
  description?: string | null;
};

export type RoleActionResult = {
  success: boolean;
  message: string;
};
