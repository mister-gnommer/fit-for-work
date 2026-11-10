"use server";

import { redirect } from "next/navigation";

import { requireCompanyContext } from "@/lib/access";
import { fieldErrors, formValues, type FormState } from "@/lib/forms";

import { readFactorSelection } from "../templates/selection";
import { createReferral, referralInputSchema } from "./service";
import { warsawDate } from "./snapshot";

/** A text form value, or undefined when the field is missing. */
function text(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/**
 * Creates a referral for the bound employee and opens its page. Factors come from the shared
 * factor picker (`factor-<id>` checkboxes, `exposure-<id>` levels).
 */
export async function createReferralAction(employeeId: string, _state: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireCompanyContext();
  const now = new Date();
  const parsed = referralInputSchema(warsawDate(now)).safeParse({
    examType: text(formData.get("examType")),
    employmentStatus: text(formData.get("employmentStatus")),
    position: text(formData.get("position")),
    workDescription: text(formData.get("workDescription")),
    deadline: text(formData.get("deadline")),
    factors: readFactorSelection(formData).map((factor) => ({ id: factor.riskFactorId, exposureLevel: factor.exposureLevel ?? undefined })),
  });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values: formValues(formData) };
  }
  const result = await createReferral(ctx, employeeId, parsed.data, now);
  if (!result.ok) {
    return { errors: result.errors, values: formValues(formData) };
  }
  redirect(`/referrals/${result.id}`);
}
