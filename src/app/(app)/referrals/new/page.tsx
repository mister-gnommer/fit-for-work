import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getEmployee, listEmployees } from "@/features/employees/service";
import { ReferralForm } from "@/features/referrals/referral-form";
import { warsawDate } from "@/features/referrals/snapshot";
import { listRiskFactors } from "@/features/risk-factors/service";
import { requireCompanyContext } from "@/lib/access";

// Step 1 picks the employee with a plain GET form; step 2 (?employeeId=…) shows the referral form.
export default async function NewReferralPage({ searchParams }: PageProps<"/referrals/new">) {
  const ctx = await requireCompanyContext();
  const { employeeId } = await searchParams;

  if (typeof employeeId !== "string" || !employeeId) {
    const employees = await listEmployees(ctx);
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
          <form method="get" className="flex max-w-xl items-end gap-3">
            <div className="grid flex-1 gap-1.5">
              <Label htmlFor="employeeId">Pracownik</Label>
              <select id="employeeId" name="employeeId" required className="h-9 rounded-md border px-3 text-sm">
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.lastName} {employee.firstName} – {employee.position}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit">Dalej</Button>
          </form>
        )}
      </>
    );
  }

  const employee = await getEmployee(ctx, employeeId);
  const factors = await listRiskFactors(ctx.companyId);
  return (
    <>
      <h1 className="text-2xl font-semibold">
        Nowe skierowanie: {employee.firstName} {employee.lastName}
      </h1>
      <ReferralForm
        employee={{ id: employee.id, position: employee.position, workDescription: employee.workDescription }}
        // Predefined first within each category, as on the risk factor page.
        factors={[...factors.filter((factor) => !factor.companyId), ...factors.filter((factor) => factor.companyId)].map((factor) => ({
          id: factor.id,
          category: factor.category,
          name: factor.name,
          predefined: !factor.companyId,
        }))}
        today={warsawDate(new Date())}
      />
    </>
  );
}
