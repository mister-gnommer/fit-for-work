"use client";

import { useActionState } from "react";

import { FactorPicker, type PickerFactor } from "@/components/factor-picker";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/forms";

import { saveTemplateAction } from "./actions";

type TemplateValues = { name: string; factors: { riskFactorId: string; exposureLevel: string | null }[] };

/**
 * Create/edit form for a template: a name, then every available factor by category with a
 * checkbox and an optional exposure level.
 * @param factors predefined and own factors the company may use
 */
export function TemplateForm({ templateId, template, factors }: { templateId: string | null; template?: TemplateValues; factors: PickerFactor[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveTemplateAction.bind(null, templateId), {});
  const saved = new Map(template?.factors.map((factor) => [factor.riskFactorId, factor.exposureLevel]));
  // After a failed save, the submitted values win, including which boxes were left unchecked.
  const checked = (id: string) => (state.values ? `factor-${id}` in state.values : saved.has(id));
  const exposure = (id: string) => state.values?.[`exposure-${id}`] ?? saved.get(id) ?? "";

  return (
    <form action={action} className="grid max-w-3xl gap-6">
      <Field name="name" label="Nazwa szablonu" defaultValue={state.values?.name ?? template?.name ?? ""} error={state.errors?.name} required />
      {state.errors?.factors && <p className="text-sm text-destructive">{state.errors.factors}</p>}
      <FactorPicker factors={factors} isChecked={checked} exposure={exposure} />
      <div>
        <Button type="submit" disabled={pending}>Zapisz</Button>
      </div>
    </form>
  );
}
