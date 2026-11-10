import { redirect } from "next/navigation";

import { hasAdmin } from "@/features/users/service";
import { UserForm } from "@/features/users/user-form";
import { requireCompanyContext } from "@/lib/access";
import { canCreateUser } from "@/lib/permissions";

export default async function NewUserPage() {
  const { user, companyId } = await requireCompanyContext();
  if (!canCreateUser(user, "OPERATOR")) {
    redirect("/users");
  }
  const roles: ("ADMIN" | "OPERATOR")[] = canCreateUser(user, "ADMIN") && !(await hasAdmin(companyId)) ? ["ADMIN", "OPERATOR"] : ["OPERATOR"];

  return (
    <>
      <h1 className="text-2xl font-semibold">Nowy użytkownik</h1>
      <UserForm roles={roles} />
    </>
  );
}
