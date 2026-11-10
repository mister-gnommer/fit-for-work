"use server";

import { APIError } from "better-auth/api";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { COMPANY_COOKIE } from "@/lib/access";
import { auth } from "@/lib/auth";
import type { FormState } from "@/lib/forms";

/**
 * Logs in with email and password. Every rejection (unknown email, wrong password, deleted
 * account or company) gets the same message so the form doesn't reveal which accounts exist.
 */
export async function loginAction(_state: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    await auth.api.signInEmail({ body: { email, password }, headers: await headers() });
  } catch (error) {
    if (!(error instanceof APIError)) {
      throw error;
    }
    return { message: "Nieprawidłowy e-mail lub hasło.", values: { email } };
  }
  redirect("/");
}

/** Ends the session and forgets Telemedi's selected company. */
export async function logoutAction(): Promise<void> {
  await auth.api.signOut({ headers: await headers() });
  (await cookies()).delete(COMPANY_COOKIE);
  redirect("/login");
}
