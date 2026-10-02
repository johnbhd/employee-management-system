import { ProfilePage } from "@/components/employee/profile/ProfilePage";
import { requireCurrentUserContext } from "@/server/auth/current-user-context";

export default async function Page() {
  const context = await requireCurrentUserContext();

  return <ProfilePage user={context.user} employee={context.employee} />;
}
