import { z } from "zod";

/** What a form action returns to `useActionState` when it doesn't redirect. */
export type FormState = {
  errors?: Record<string, string>;
  message?: string;
  values?: Record<string, string>;
};

export type ServiceResult = { ok: true } | { ok: false; errors: Record<string, string> };

/** A required, trimmed text field with a Polish message. */
export function requiredText(message: string) {
  return z.string(message).trim().min(1, message);
}

/** An optional, trimmed text field stored as null when left empty. */
export const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || null);

/**
 * The first message for each invalid field, keyed by field name.
 * @param error the failed parse
 */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    errors[field] ??= issue.message;
  }
  return errors;
}

/**
 * The submitted text values, so a form can be re-rendered after an error. Passwords are
 * never echoed back.
 */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (typeof value === "string" && !key.startsWith("$ACTION") && key !== "password") {
      values[key] = value;
    }
  }
  return values;
}
