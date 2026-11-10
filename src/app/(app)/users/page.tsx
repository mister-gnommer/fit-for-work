import Link from "next/link";

import { ConfirmButton } from "@/components/confirm-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteUserAction } from "@/features/users/actions";
import { listUsers } from "@/features/users/service";
import { requireCompanyContext } from "@/lib/access";
import { roleLabels } from "@/lib/labels";
import { canCreateUser, canDeleteUser, canSetPassword } from "@/lib/permissions";

export default async function UsersPage() {
  const { user, companyId } = await requireCompanyContext();
  const users = await listUsers(companyId);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Użytkownicy</h1>
        {canCreateUser(user, "OPERATOR") && (
          <Button asChild>
            <Link href="/users/new">Dodaj użytkownika</Link>
          </Button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Imię i nazwisko</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Rola</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{roleLabels[row.role]}</TableCell>
              <TableCell className="space-x-2 text-right">
                {canSetPassword(user, row) && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/users/${row.id}/password`}>Ustaw hasło</Link>
                  </Button>
                )}
                {canDeleteUser(user, row) && (
                  <ConfirmButton
                    question={row.id === user.id ? "Usunąć Twoje konto? Zostaniesz wylogowany." : `Usunąć użytkownika ${row.name}?`}
                    action={deleteUserAction.bind(null, row.id)}
                  >
                    {row.id === user.id ? "Usuń moje konto" : "Usuń"}
                  </ConfirmButton>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {users.length === 0 && <p className="text-muted-foreground">Ta firma nie ma jeszcze użytkowników.</p>}
    </>
  );
}
