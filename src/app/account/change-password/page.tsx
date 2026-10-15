import { redirect } from "next/navigation";

import { getRoleHomePath } from "@/lib/auth/roles";
import { requireSessionUser } from "@/server/auth/guards";

export default async function Page() {
  const user = await requireSessionUser();

  if (user.role !== "employee") {
    redirect(getRoleHomePath(user.role));
  }

  redirect(
    user.mustChangePassword
      ? "/employee/settings?setup=password"
      : "/employee/settings",
  );
}
