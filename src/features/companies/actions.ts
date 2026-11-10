"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { COMPANY_COOKIE, requireTelemedi } from "@/lib/access";
import { fieldErrors, formValues, type FormState } from "@/lib/forms";

import { companySchema, createCompany, deleteCompany, getCompany, updateCompany } from "./service";

/**
 * Creates a company, or updates it when `companyId` is bound. Redirects to the list on success.
 * @param companyId company to update, or null to create one
 */
export async function saveCompanyAction(companyId: string | null, _state: FormState, formData: FormData): Promise<FormState> {
  const user = await requireTelemedi();
  const parsed = companySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values: formValues(formData) };
  }
  const result = companyId ? await updateCompany(user, companyId, parsed.data) : await createCompany(user, parsed.data);
  if (!result.ok) {
    return { errors: result.errors, values: formValues(formData) };
  }
  revalidatePath("/", "layout");
  redirect("/companies");
}

/** Soft deletes a company. */
export async function deleteCompanyAction(companyId: string): Promise<void> {
  const user = await requireTelemedi();
  await deleteCompany(user, companyId);
  revalidatePath("/", "layout");
}

/** Makes the chosen company Telemedi's working company and opens its user list. */
export async function selectCompanyAction(formData: FormData): Promise<void> {
  await requireTelemedi();
  const company = await getCompany(String(formData.get("companyId") ?? ""));
  (await cookies()).set(COMPANY_COOKIE, company.id, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/users");
}
