"use client";

import { useActionState } from "react";

import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RiskCategory } from "@/generated/prisma/enums";
import type { FormState } from "@/lib/forms";
import { riskCategoryLabels } from "@/lib/labels";

import { saveRiskFactorAction } from "./actions";

/** Create/edit form for one of the company's own risk factors. */
export function RiskFactorForm({ id, factor }: { id: string | null; factor?: { category: RiskCategory; name: string } }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveRiskFactorAction.bind(null, id), {});

  return (
    <form action={action} className="grid max-w-xl gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="category">Kategoria</Label>
        <select
          id="category"
          name="category"
          defaultValue={state.values?.category ?? factor?.category ?? RiskCategory.PHYSICAL}
          className="h-9 rounded-md border px-3 text-sm"
        >
          {Object.values(RiskCategory).map((category) => (
            <option key={category} value={category}>
              {riskCategoryLabels[category]}
            </option>
          ))}
        </select>
        {state.errors?.category && <p className="text-sm text-destructive">{state.errors.category}</p>}
      </div>
      <Field name="name" label="Nazwa" defaultValue={state.values?.name ?? factor?.name ?? ""} error={state.errors?.name} required maxLength={200} />
      <div>
        <Button type="submit" disabled={pending}>
          Zapisz
        </Button>
      </div>
    </form>
  );
}
