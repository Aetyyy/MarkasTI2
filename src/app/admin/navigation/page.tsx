import NavigationManager from "./navigationManager";
import { requirePagePermission } from "@/libs/auth/authorization";
import { getCrudAccess, PERMISSION_SCOPES } from "@/libs/auth/access";

export default async function NavigationPage() {
  const user = await requirePagePermission(PERMISSION_SCOPES.navigation, "read");
  return (
    <NavigationManager
      access={getCrudAccess(user, PERMISSION_SCOPES.navigation)}
    />
  );
}
