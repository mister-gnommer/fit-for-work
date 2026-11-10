import { EmployeeForm } from "@/features/employees/employee-form";
import { requireCompanyContext } from "@/lib/access";

export default async function NewEmployeePage() {
  await requireCompanyContext();
  return (
    <>
      <h1 className="text-2xl font-semibold">Nowy pracownik</h1>
      <EmployeeForm employeeId={null} />
    </>
  );
}
