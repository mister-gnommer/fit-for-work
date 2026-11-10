import { RiskFactorForm } from "@/features/risk-factors/risk-factor-form";
import { getCompanyRiskFactor } from "@/features/risk-factors/service";
import { requireCompanyContext } from "@/lib/access";

export default async function EditRiskFactorPage({ params }: PageProps<"/risk-factors/[id]/edit">) {
  const ctx = await requireCompanyContext();
  const factor = await getCompanyRiskFactor(ctx, (await params).id);
  return (
    <>
      <h1 className="text-2xl font-semibold">Edycja czynnika szkodliwego</h1>
      <RiskFactorForm id={factor.id} factor={factor} />
    </>
  );
}
