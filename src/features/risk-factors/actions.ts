"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCompanyContext } from "@/lib/access";
import { fieldErrors, formValues, type FormState } from "@/lib/forms";

import { createRiskFactor, deleteRiskFactor, riskFactorSchema, updateRiskFactor } from "./service";

/**
 * Adds a company factor, or updates it when `id` is bound. Redirects to the list on success.
 * @param id factor to update, or null to create one
 */
export async function saveRiskFactorAction(id: string | null, _state: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireCompanyContext();
  const parsed = riskFactorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values: formValues(formData) };
  }
  const result = id ? await updateRiskFactor(ctx, id, parsed.data) : await createRiskFactor(ctx, parsed.data);
  if (!result.ok) {
    return { errors: result.errors, values: formValues(formData) };
  }
  revalidatePath("/risk-factors");
  redirect("/risk-factors");
}

/** Soft deletes one of the company's own factors. */
export async function deleteRiskFactorAction(id: string): Promise<void> {
  const ctx = await requireCompanyContext();
  await deleteRiskFactor(ctx, id);
  revalidatePath("/risk-factors");
}
