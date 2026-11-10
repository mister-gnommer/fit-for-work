"use client";

import { startTransition, useActionState, useState } from "react";

import { FactorPicker, type PickerFactor } from "@/components/factor-picker";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ExamType } from "@/generated/prisma/enums";
import type { FormState } from "@/lib/forms";
import { employmentStatusLabels, examTypeLabels } from "@/lib/labels";
import type { EmploymentStatus } from "@/lib/referral-pdf/snapshot";

import { createReferralAction } from "./actions";
import { defaultEmploymentStatus } from "./snapshot";

const SELECT = "h-9 rounded-md border px-3 text-sm";

type Props = {
  employee: { id: string; position: string; workDescription: string };
  factors: PickerFactor[];
  /** Factors to tick when the form opens (from a template), with their exposure levels. */
  initial: Map<string, string | null>;
  /** `yyyy-MM-dd` in Poland; the earliest allowed deadline. */
  today: string;
};

/** The referral form for one employee: exam data, risk factors with exposure levels, deadline. */
export function ReferralForm({ employee, factors, initial, today }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(createReferralAction.bind(null, employee.id), {});
  const values = state.values ?? {};
  const [examType, setExamType] = useState<ExamType>(ExamType.PERIODIC);
  // Until the user picks a status by hand, it follows the exam type.
  const [chosenStatus, setChosenStatus] = useState<EmploymentStatus | null>(null);
  const employmentStatus = chosenStatus ?? defaultEmploymentStatus(examType);
  // After a failed save, the submitted values win, including which boxes were left unchecked.
  const isChecked = (id: string) => (state.values ? `factor-${id}` in state.values : initial.has(id));
  const exposure = (id: string) => state.values?.[`exposure-${id}`] ?? initial.get(id) ?? "";

  return (
    <form
      // Submitting via onSubmit skips React's automatic form reset after the action, which
      // would put the two controlled selects back to their first option on a validation error.
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
      className="grid max-w-3xl gap-4"
    >
      {state.errors?.form && <p className="text-sm text-destructive">{state.errors.form}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="examType">Rodzaj badania</Label>
          <select
            id="examType"
            name="examType"
            value={examType}
            onChange={(event) => setExamType(Object.values(ExamType).find((type) => type === event.target.value) ?? ExamType.PERIODIC)}
            className={SELECT}
          >
            {Object.values(ExamType).map((type) => (
              <option key={type} value={type}>
                {examTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="employmentStatus">Status zatrudnienia</Label>
          <select
            id="employmentStatus"
            name="employmentStatus"
            value={employmentStatus}
            onChange={(event) => setChosenStatus(event.target.value === "TAKING_UP_WORK" ? "TAKING_UP_WORK" : "EMPLOYED")}
            className={SELECT}
          >
            <option value="EMPLOYED">{employmentStatusLabels.EMPLOYED}</option>
            <option value="TAKING_UP_WORK">{employmentStatusLabels.TAKING_UP_WORK}</option>
          </select>
        </div>
      </div>
      <Field name="position" label="Stanowisko" defaultValue={values.position ?? employee.position} error={state.errors?.position} required />
      <div className="grid gap-1.5">
        <Label htmlFor="workDescription">Opis pracy</Label>
        <textarea
          id="workDescription"
          name="workDescription"
          defaultValue={values.workDescription ?? employee.workDescription}
          rows={3}
          required
          className="rounded-md border px-3 py-2 text-sm"
        />
        {state.errors?.workDescription && <p className="text-sm text-destructive">{state.errors.workDescription}</p>}
      </div>

      <fieldset className="grid gap-3">
        <legend className="mb-2 text-lg font-semibold">Czynniki szkodliwe</legend>
        {state.errors?.factors && <p className="text-sm text-destructive">{state.errors.factors}</p>}
        <FactorPicker factors={factors} isChecked={isChecked} exposure={exposure} />
      </fieldset>

      <Field
        name="deadline"
        label="Termin"
        type="date"
        min={today}
        defaultValue={values.deadline ?? ""}
        error={state.errors?.deadline}
        required
        className="w-48"
      />
      <div>
        <Button type="submit" disabled={pending}>
          Utwórz skierowanie
        </Button>
      </div>
    </form>
  );
}
