import { listRiskFactors } from "@/features/risk-factors/service";
import { getTemplate } from "@/features/templates/service";
import { TemplateForm } from "@/features/templates/template-form";
import { requireCompanyContext } from "@/lib/access";

export default async function EditTemplatePage({ params }: PageProps<"/templates/[id]/edit">) {
  const ctx = await requireCompanyContext();
  const { id } = await params;
  const [template, factors] = await Promise.all([getTemplate(ctx, id), listRiskFactors(ctx.companyId)]);
  return (
    <>
      <h1 className="text-2xl font-semibold">Edycja szablonu</h1>
      <TemplateForm templateId={template.id} template={template} factors={factors} />
    </>
  );
}
