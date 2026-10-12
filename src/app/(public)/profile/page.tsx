import { getMyProfileForEdit } from "./actions";
import ProfileClient from "./profileClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await getMyProfileForEdit();

  return <ProfileClient initialProfile={profile} />;
}
