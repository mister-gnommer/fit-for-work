"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCompanyContext } from "@/lib/access";
import { fieldErrors, formValues, type FormState } from "@/lib/forms";

import { changePassword, createUser, deleteUser, newUserSchema, passwordSchema } from "./service";

/** Creates an admin or operator in the current company. */
export async function createUserAction(_state: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireCompanyContext();
  const parsed = newUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values: formValues(formData) };
  }
  const result = await createUser(ctx, parsed.data);
  if (!result.ok) {
    return { errors: result.errors, values: formValues(formData) };
  }
  revalidatePath("/users");
  redirect("/users");
}

/** Sets a new password for a user of the current company. */
export async function changePasswordAction(userId: string, _state: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireCompanyContext();
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) {
    return { errors: { password: parsed.error.issues[0].message } };
  }
  await changePassword(ctx, userId, parsed.data);
  redirect("/users");
}

/** Soft deletes a user; deleting your own account logs you out. */
export async function deleteUserAction(userId: string): Promise<void> {
  const ctx = await requireCompanyContext();
  await deleteUser(ctx, userId);
  if (userId === ctx.user.id) {
    redirect("/login");
  }
  revalidatePath("/users");
}
