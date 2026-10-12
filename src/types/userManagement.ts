export type RoleOption = {
  id: string;
  name: string;
};

export type UserForClient = {
  id: string;
  name: string;
  nim: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  roles: RoleOption[];
};

export type ActionResult = {
  success: boolean;
  message: string;
};
