import { redirect } from "next/navigation";

import { LoginPage } from "@/components/auth/LoginPage";
import { getRoleHomePath } from "@/lib/auth/roles";
import { getOptionalSessionUser } from "@/server/auth/session";

export default async function Page() {
  const user = await getOptionalSessionUser();

  if (user) {
    redirect(getRoleHomePath(user.role));
  }

  return <LoginPage />;
}
