"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCompanyContext } from "@/lib/access";
import { fieldErrors, formValues, type FormState } from "@/lib/forms";

import { createEmployee, deleteEmployee, employeeSchema, updateEmployee } from "./service";

/**
 * Creates an employee in the current company, or updates one when `employeeId` is bound.
 * Redirects to the list on success.
 * @param employeeId employee to update, or null to create one
 */
export async function saveEmployeeAction(employeeId: string | null, _state: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireCompanyContext();
  const parsed = employeeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values: formValues(formData) };
  }
  const result = employeeId ? await updateEmployee(ctx, employeeId, parsed.data) : await createEmployee(ctx, parsed.data);
  if (!result.ok) {
    return { errors: result.errors, values: formValues(formData) };
  }
  revalidatePath("/employees");
  redirect("/employees");
}

/** Soft deletes an employee of the current company. */
export async function deleteEmployeeAction(employeeId: string): Promise<void> {
  const ctx = await requireCompanyContext();
  await deleteEmployee(ctx, employeeId);
  revalidatePath("/employees");
}
