import { EmployeeForm } from "@/features/employees/employee-form";
import { getEmployee } from "@/features/employees/service";
import { requireCompanyContext } from "@/lib/access";

export default async function EditEmployeePage({ params }: PageProps<"/employees/[id]/edit">) {
  const ctx = await requireCompanyContext();
  const { id } = await params;
  const employee = await getEmployee(ctx, id);
  return (
    <>
      <h1 className="text-2xl font-semibold">Edycja pracownika</h1>
      <EmployeeForm employeeId={employee.id} employee={employee} />
    </>
  );
}
