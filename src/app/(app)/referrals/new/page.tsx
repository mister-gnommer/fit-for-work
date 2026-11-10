import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getEmployee, listEmployees } from "@/features/employees/service";
import { ReferralForm } from "@/features/referrals/referral-form";
import { warsawDate } from "@/features/referrals/snapshot";
import { listRiskFactors } from "@/features/risk-factors/service";
import { getTemplate, listTemplates } from "@/features/templates/service";
import { requireCompanyContext } from "@/lib/access";

const SELECT = "h-9 rounded-md border px-3 text-sm";

// Step 1 picks the employee and an optional template with a plain GET form; step 2
// (?employeeId=…&templateId=…) shows the referral form, pre-filled from the template.
export default async function NewReferralPage({ searchParams }: PageProps<"/referrals/new">) {
  const ctx = await requireCompanyContext();
  const { employeeId, templateId } = await searchParams;

  if (typeof employeeId !== "string" || !employeeId) {
    const [employees, templates] = await Promise.all([listEmployees(ctx), listTemplates(ctx)]);
    return (
      <>
        <h1 className="text-2xl font-semibold">Nowe skierowanie</h1>
        {employees.length === 0 ? (
          <p>
            Ta firma nie ma jeszcze pracowników.{" "}
            <Link href="/employees/new" className="underline">
              Dodaj pracownika
            </Link>
          </p>
        ) : (
          <form method="get" className="grid max-w-xl gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="employeeId">Pracownik</Label>
              <select id="employeeId" name="employeeId" required className={SELECT}>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.lastName} {employee.firstName} – {employee.position}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="templateId">Szablon</Label>
              <select id="templateId" name="templateId" className={SELECT}>
                <option value="">Bez szablonu</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Button type="submit">Dalej</Button>
            </div>
          </form>
        )}
      </>
    );
  }

  const [employee, factors, template] = await Promise.all([
    getEmployee(ctx, employeeId),
    listRiskFactors(ctx.companyId),
    typeof templateId === "string" && templateId ? getTemplate(ctx, templateId) : null,
  ]);
  // getTemplate returns only the template's factors that aren't deleted.
  const initial = new Map(template?.factors.map((factor) => [factor.riskFactorId, factor.exposureLevel]));

  return (
    <>
      <h1 className="text-2xl font-semibold">
        Nowe skierowanie: {employee.firstName} {employee.lastName}
      </h1>
      <p className="text-sm">
        Szablon: {template ? template.name : "bez szablonu"}{" "}
        <Link href="/referrals/new" className="underline">
          Zmień
        </Link>
      </p>
      <ReferralForm
        // A new key per employee and template, so client navigation never keeps stale ticks.
        key={`${employee.id}:${template?.id ?? ""}`}
        employee={{ id: employee.id, position: employee.position, workDescription: employee.workDescription }}
        factors={factors}
        initial={initial}
        today={warsawDate(new Date())}
      />
    </>
  );
}
