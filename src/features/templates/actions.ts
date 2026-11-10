"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCompanyContext } from "@/lib/access";
import { fieldErrors, formValues, type FormState } from "@/lib/forms";

import { readFactorSelection } from "./selection";
import { createTemplate, deleteTemplate, templateSchema, updateTemplate } from "./service";

/**
 * Creates a template in the current company, or updates one when `templateId` is bound.
 * Redirects to the list on success.
 * @param templateId template to update, or null to create one
 */
export async function saveTemplateAction(templateId: string | null, _state: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireCompanyContext();
  const parsed = templateSchema.safeParse({ name: formData.get("name"), factors: readFactorSelection(formData) });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values: formValues(formData) };
  }
  const result = templateId ? await updateTemplate(ctx, templateId, parsed.data) : await createTemplate(ctx, parsed.data);
  if (!result.ok) {
    return { errors: result.errors, values: formValues(formData) };
  }
  revalidatePath("/templates");
  redirect("/templates");
}

/** Soft deletes a template of the current company. */
export async function deleteTemplateAction(templateId: string): Promise<void> {
  const ctx = await requireCompanyContext();
  await deleteTemplate(ctx, templateId);
  revalidatePath("/templates");
}
