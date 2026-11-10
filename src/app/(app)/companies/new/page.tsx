import { CompanyForm } from "@/features/companies/company-form";
import { requireTelemedi } from "@/lib/access";

export default async function NewCompanyPage() {
  await requireTelemedi();
  return (
    <>
      <h1 className="text-2xl font-semibold">Nowa firma</h1>
      <CompanyForm companyId={null} />
    </>
  );
}
