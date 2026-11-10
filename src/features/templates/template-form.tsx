"use client";

import { useActionState } from "react";

import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RiskCategory } from "@/generated/prisma/enums";
import type { FormState } from "@/lib/forms";
import { riskCategoryLabels, riskCategoryNumerals } from "@/lib/labels";

import { saveTemplateAction } from "./actions";

type Factor = { id: string; category: RiskCategory; name: string; companyId: string | null };
type TemplateValues = { name: string; factors: { riskFactorId: string; exposureLevel: string | null }[] };

/**
 * Create/edit form for a template: a name, then every available factor by category with a
 * checkbox and an optional exposure level.
 * @param factors predefined and own factors the company may use
 */
export function TemplateForm({ templateId, template, factors }: { templateId: string | null; template?: TemplateValues; factors: Factor[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveTemplateAction.bind(null, templateId), {});
  const saved = new Map(template?.factors.map((factor) => [factor.riskFactorId, factor.exposureLevel]));
  // After a failed save, the submitted values win, including which boxes were left unchecked.
  const checked = (id: string) => (state.values ? `factor-${id}` in state.values : saved.has(id));
  const exposure = (id: string) => state.values?.[`exposure-${id}`] ?? saved.get(id) ?? "";

  return (
    <form action={action} className="grid max-w-3xl gap-6">
      <Field name="name" label="Nazwa szablonu" defaultValue={state.values?.name ?? template?.name ?? ""} error={state.errors?.name} required />
      {state.errors?.factors && <p className="text-sm text-destructive">{state.errors.factors}</p>}
      {Object.values(RiskCategory).map((category) => (
        <fieldset key={category} className="grid gap-2">
          <legend className="mb-2 font-semibold">
            {riskCategoryNumerals[category]}. {riskCategoryLabels[category]}
          </legend>
          <ul className="divide-y rounded-md border">
            {factors
              .filter((factor) => factor.category === category)
              .map((factor) => (
                <li key={factor.id} className="grid grid-cols-[1fr_16rem] items-center gap-4 px-4 py-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name={`factor-${factor.id}`} defaultChecked={checked(factor.id)} />
                    {factor.name}
                  </label>
                  <Input
                    name={`exposure-${factor.id}`}
                    aria-label={`Wielkość narażenia: ${factor.name}`}
                    placeholder="Wielkość narażenia (opcjonalnie)"
                    defaultValue={exposure(factor.id)}
                  />
                </li>
              ))}
          </ul>
        </fieldset>
      ))}
      <div>
        <Button type="submit" disabled={pending}>Zapisz</Button>
      </div>
    </form>
  );
}
