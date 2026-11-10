import Link from "next/link";

import { ConfirmButton } from "@/components/confirm-button";
import { Button } from "@/components/ui/button";
import { RiskCategory } from "@/generated/prisma/enums";
import { deleteRiskFactorAction } from "@/features/risk-factors/actions";
import { listRiskFactors } from "@/features/risk-factors/service";
import { requireCompanyContext } from "@/lib/access";
import { riskCategoryLabels } from "@/lib/labels";

const ROMAN = ["I", "II", "III", "IV", "V"];

export default async function RiskFactorsPage() {
  const { companyId } = await requireCompanyContext();
  const factors = await listRiskFactors(companyId);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Czynniki szkodliwe</h1>
        <Button asChild>
          <Link href="/risk-factors/new">Dodaj czynnik</Link>
        </Button>
      </div>
      {Object.values(RiskCategory).map((category, index) => {
        const inCategory = factors.filter((factor) => factor.category === category);
        // Predefined first, then the company's own, each in creation order.
        const ordered = [...inCategory.filter((factor) => !factor.companyId), ...inCategory.filter((factor) => factor.companyId)];
        return (
          <section key={category} className="grid gap-2">
            <h2 className="text-lg font-semibold">
              {ROMAN[index]}. {riskCategoryLabels[category]}
            </h2>
            <ul className="divide-y rounded-md border">
              {ordered.map((factor) => (
                <li key={factor.id} className="flex items-center justify-between gap-4 px-4 py-2 text-sm">
                  <span>
                    {factor.name}
                    {!factor.companyId && <span className="ml-2 text-muted-foreground">(predefiniowany)</span>}
                  </span>
                  {factor.companyId && (
                    <span className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/risk-factors/${factor.id}/edit`}>Edytuj</Link>
                      </Button>
                      <ConfirmButton question={`Usunąć czynnik „${factor.name}”?`} action={deleteRiskFactorAction.bind(null, factor.id)}>
                        Usuń
                      </ConfirmButton>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
