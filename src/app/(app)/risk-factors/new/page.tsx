import { RiskFactorForm } from "@/features/risk-factors/risk-factor-form";
import { requireCompanyContext } from "@/lib/access";

export default async function NewRiskFactorPage() {
  await requireCompanyContext();
  return (
    <>
      <h1 className="text-2xl font-semibold">Nowy czynnik szkodliwy</h1>
      <RiskFactorForm id={null} />
    </>
  );
}
