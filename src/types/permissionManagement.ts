export type PermissionScopeForClient = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PermissionActionResult = {
  success: boolean;
  message: string;
};
