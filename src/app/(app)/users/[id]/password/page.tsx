import { redirect } from "next/navigation";

import { getCompanyUser } from "@/features/users/service";
import { PasswordForm } from "@/features/users/user-form";
import { requireCompanyContext } from "@/lib/access";
import { canSetPassword } from "@/lib/permissions";

export default async function UserPasswordPage({ params }: PageProps<"/users/[id]/password">) {
  const ctx = await requireCompanyContext();
  const target = await getCompanyUser(ctx, (await params).id);
  if (!canSetPassword(ctx.user, target)) {
    redirect("/users");
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">Hasło: {target.name}</h1>
      <PasswordForm userId={target.id} />
    </>
  );
}
