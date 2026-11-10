"use client";

import { useActionState } from "react";

import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/features/auth/actions";
import type { FormState } from "@/lib/forms";

/** Email and password login form with one generic error message. */
export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={action} className="grid gap-4">
      <Field name="email" label="E-mail" type="email" autoComplete="username" defaultValue={state.values?.email} required />
      <Field name="password" label="Hasło" type="password" autoComplete="current-password" required />
      {state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>Zaloguj się</Button>
    </form>
  );
}
