"use client";

import { useActionState } from "react";

import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Sex } from "@/generated/prisma/enums";
import type { FormState } from "@/lib/forms";
import { sexLabels } from "@/lib/labels";

import { saveEmployeeAction } from "./actions";

type EmployeeValues = {
  firstName: string;
  lastName: string;
  sex: Sex;
  pesel: string | null;
  idDocumentName: string | null;
  idDocumentNumber: string | null;
  birthDate: string | null;
  city: string;
  street: string | null;
  buildingNumber: string;
  flatNumber: string | null;
  position: string;
  workDescription: string;
};

/** Create/edit form for an employee's data printed on referrals. */
export function EmployeeForm({ employeeId, employee }: { employeeId: string | null; employee?: EmployeeValues }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveEmployeeAction.bind(null, employeeId), {});
  const value = (field: keyof EmployeeValues) => state.values?.[field] ?? employee?.[field] ?? "";
  const error = (field: keyof EmployeeValues) => state.errors?.[field];

  return (
    <form action={action} className="grid max-w-xl gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field name="firstName" label="Imię" defaultValue={value("firstName")} error={error("firstName")} required />
        <Field name="lastName" label="Nazwisko" defaultValue={value("lastName")} error={error("lastName")} required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="sex">Płeć</Label>
        {/* React ignores defaultValue changes on a mounted select, and the form resets after each action, so remount on the submitted value. */}
        <select key={value("sex")} id="sex" name="sex" defaultValue={value("sex")} required className="h-9 rounded-md border px-3 text-sm">
          <option value="" disabled>Wybierz</option>
          {Object.entries(sexLabels).map(([sex, label]) => (
            <option key={sex} value={sex}>{label}</option>
          ))}
        </select>
        {error("sex") && <p className="text-sm text-destructive">{error("sex")}</p>}
      </div>
      <Field name="pesel" label="PESEL" inputMode="numeric" defaultValue={value("pesel")} error={error("pesel")} />
      <fieldset className="grid gap-4 rounded-md border p-4">
        <legend className="px-1 text-sm font-medium">Jeśli brak numeru PESEL</legend>
        <Field name="idDocumentName" label="Nazwa dokumentu tożsamości" defaultValue={value("idDocumentName")} error={error("idDocumentName")} />
        <Field name="idDocumentNumber" label="Seria i numer dokumentu" defaultValue={value("idDocumentNumber")} error={error("idDocumentNumber")} />
        <Field name="birthDate" label="Data urodzenia" type="date" defaultValue={value("birthDate")} error={error("birthDate")} />
      </fieldset>
      <Field name="city" label="Miejscowość" defaultValue={value("city")} error={error("city")} required />
      <Field name="street" label="Ulica (opcjonalnie)" defaultValue={value("street")} error={error("street")} />
      <div className="grid grid-cols-2 gap-4">
        <Field name="buildingNumber" label="Numer budynku" defaultValue={value("buildingNumber")} error={error("buildingNumber")} required />
        <Field name="flatNumber" label="Numer lokalu (opcjonalnie)" defaultValue={value("flatNumber")} error={error("flatNumber")} />
      </div>
      <Field name="position" label="Stanowisko" defaultValue={value("position")} error={error("position")} required />
      <div className="grid gap-1.5">
        <Label htmlFor="workDescription">Opis pracy</Label>
        <textarea
          id="workDescription"
          name="workDescription"
          rows={4}
          defaultValue={value("workDescription")}
          aria-invalid={error("workDescription") ? true : undefined}
          required
          className="rounded-md border px-3 py-2 text-sm"
        />
        {error("workDescription") && <p className="text-sm text-destructive">{error("workDescription")}</p>}
      </div>
      <div>
        <Button type="submit" disabled={pending}>Zapisz</Button>
      </div>
    </form>
  );
}
