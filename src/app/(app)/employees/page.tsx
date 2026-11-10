import Link from "next/link";

import { ConfirmButton } from "@/components/confirm-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteEmployeeAction } from "@/features/employees/actions";
import { listEmployees } from "@/features/employees/service";
import { requireCompanyContext } from "@/lib/access";

export default async function EmployeesPage() {
  const ctx = await requireCompanyContext();
  const employees = await listEmployees(ctx);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pracownicy</h1>
        <Button asChild>
          <Link href="/employees/new">Dodaj pracownika</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Imię i nazwisko</TableHead>
            <TableHead>PESEL / dokument</TableHead>
            <TableHead>Stanowisko</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell>{employee.firstName} {employee.lastName}</TableCell>
              <TableCell>{employee.pesel ?? `${employee.idDocumentName} ${employee.idDocumentNumber}`}</TableCell>
              <TableCell>{employee.position}</TableCell>
              <TableCell className="space-x-2 text-right">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/employees/${employee.id}/edit`}>Edytuj</Link>
                </Button>
                <ConfirmButton question={`Usunąć pracownika ${employee.firstName} ${employee.lastName}?`} action={deleteEmployeeAction.bind(null, employee.id)}>
                  Usuń
                </ConfirmButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {employees.length === 0 && <p className="text-muted-foreground">Brak pracowników.</p>}
    </>
  );
}
