import { CompanyForm } from "@/features/companies/company-form";
import { getCompany } from "@/features/companies/service";
import { requireTelemedi } from "@/lib/access";

export default async function EditCompanyPage({ params }: PageProps<"/companies/[id]/edit">) {
  await requireTelemedi();
  const { id } = await params;
  const company = await getCompany(id);
  return (
    <>
      <h1 className="text-2xl font-semibold">Edycja firmy</h1>
      <CompanyForm companyId={company.id} company={company} />
    </>
  );
}
