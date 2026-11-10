"use client";

import { useActionState } from "react";

import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/forms";
import { roleLabels } from "@/lib/labels";

import { changePasswordAction, createUserAction } from "./actions";

/**
 * Form for a new company account.
 * @param roles roles the viewer may pick; with only one, no select is shown
 */
export function UserForm({ roles }: { roles: ("ADMIN" | "OPERATOR")[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createUserAction, {});
  const value = (field: string) => state.values?.[field] ?? "";

  return (
    <form action={action} className="grid max-w-md gap-4">
      {state.errors?.form && <p className="text-sm text-destructive">{state.errors.form}</p>}
      <Field name="name" label="Imię i nazwisko" defaultValue={value("name")} error={state.errors?.name} required />
      <Field name="email" label="E-mail" type="email" defaultValue={value("email")} error={state.errors?.email} required />
      <Field name="password" label="Hasło" type="password" autoComplete="new-password" error={state.errors?.password} required />
      {roles.length > 1 ? (
        <div className="grid gap-1.5">
          <Label htmlFor="role">Rola</Label>
          <select id="role" name="role" defaultValue={value("role") || roles[0]} className="h-9 rounded-md border px-3 text-sm">
            {roles.map((role) => (
              <option key={role} value={role}>{roleLabels[role]}</option>
            ))}
          </select>
          {state.errors?.role && <p className="text-sm text-destructive">{state.errors.role}</p>}
        </div>
      ) : (
        <input type="hidden" name="role" value={roles[0]} />
      )}
      {roles.length === 1 && state.errors?.role && <p className="text-sm text-destructive">{state.errors.role}</p>}
      <div>
        <Button type="submit" disabled={pending}>Utwórz konto</Button>
      </div>
    </form>
  );
}

/** Form that sets a new password for the given user. */
export function PasswordForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(changePasswordAction.bind(null, userId), {});
  return (
    <form action={action} className="grid max-w-md gap-4">
      <Field name="password" label="Nowe hasło" type="password" autoComplete="new-password" error={state.errors?.password} required />
      <div>
        <Button type="submit" disabled={pending}>Zapisz hasło</Button>
      </div>
    </form>
  );
}
