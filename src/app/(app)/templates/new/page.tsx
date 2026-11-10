import { listRiskFactors } from "@/features/risk-factors/service";
import { TemplateForm } from "@/features/templates/template-form";
import { requireCompanyContext } from "@/lib/access";

export default async function NewTemplatePage() {
  const { companyId } = await requireCompanyContext();
  const factors = await listRiskFactors(companyId);
  return (
    <>
      <h1 className="text-2xl font-semibold">Nowy szablon</h1>
      <TemplateForm templateId={null} factors={factors} />
    </>
  );
}
