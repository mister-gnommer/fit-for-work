import { Input } from "@/components/ui/input";
import { RiskCategory } from "@/generated/prisma/enums";
import { riskCategoryLabels, riskCategoryNumerals } from "@/lib/labels";

export type PickerFactor = { id: string; category: RiskCategory; name: string; companyId: string | null };

type FactorPickerProps = {
  factors: PickerFactor[];
  isChecked: (id: string) => boolean;
  exposure: (id: string) => string;
};

/**
 * Every factor under the form's categories I–V, each with a checkbox `factor-<id>` and an
 * optional exposure level `exposure-<id>`; read the submission with `readFactorSelection`.
 * Predefined factors come first within a category.
 */
export function FactorPicker({ factors, isChecked, exposure }: FactorPickerProps) {
  return Object.values(RiskCategory).map((category) => {
    const inCategory = factors.filter((factor) => factor.category === category);
    const ordered = [...inCategory.filter((factor) => !factor.companyId), ...inCategory.filter((factor) => factor.companyId)];
    return (
      <fieldset key={category} className="grid gap-2">
        <legend className="mb-2 font-semibold">
          {riskCategoryNumerals[category]}. {riskCategoryLabels[category]}
        </legend>
        <ul className="divide-y rounded-md border">
          {ordered.map((factor) => (
            <li key={factor.id} className="grid grid-cols-[1fr_16rem] items-center gap-4 px-4 py-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" name={`factor-${factor.id}`} defaultChecked={isChecked(factor.id)} />
                {factor.name}
                {factor.companyId && <span className="text-muted-foreground">(własny)</span>}
              </label>
              <Input
                name={`exposure-${factor.id}`}
                aria-label={`Wielkość narażenia: ${factor.name}`}
                placeholder="Wielkość narażenia (opcjonalnie)"
                defaultValue={exposure(factor.id)}
                maxLength={200}
              />
            </li>
          ))}
        </ul>
      </fieldset>
    );
  });
}
