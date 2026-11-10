import Link from "next/link";

import { ConfirmButton } from "@/components/confirm-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteCompanyAction } from "@/features/companies/actions";
import { listCompanies } from "@/features/companies/service";
import { requireTelemedi } from "@/lib/access";

export default async function CompaniesPage() {
  await requireTelemedi();
  const companies = await listCompanies();

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Firmy</h1>
        <Button asChild>
          <Link href="/companies/new">Dodaj firmę</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nazwa</TableHead>
            <TableHead>NIP</TableHead>
            <TableHead>Adres</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.id}>
              <TableCell>{company.name}</TableCell>
              <TableCell>{company.nip}</TableCell>
              <TableCell>{formatAddress(company)}</TableCell>
              <TableCell className="space-x-2 text-right">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/companies/${company.id}/edit`}>Edytuj</Link>
                </Button>
                <ConfirmButton question={`Usunąć firmę ${company.name}? Jej użytkownicy stracą dostęp.`} action={deleteCompanyAction.bind(null, company.id)}>
                  Usuń
                </ConfirmButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {companies.length === 0 && <p className="text-muted-foreground">Brak firm.</p>}
    </>
  );
}

function formatAddress(company: { street: string | null; buildingNumber: string; flatNumber: string | null; postalCode: string; city: string }): string {
  const number = company.flatNumber ? `${company.buildingNumber}/${company.flatNumber}` : company.buildingNumber;
  const street = company.street ? `${company.street} ${number}` : `${company.city} ${number}`;
  return `${street}, ${company.postalCode} ${company.city}`;
}
