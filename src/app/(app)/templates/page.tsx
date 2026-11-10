import Link from "next/link";

import { ConfirmButton } from "@/components/confirm-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteTemplateAction } from "@/features/templates/actions";
import { listTemplates } from "@/features/templates/service";
import { requireCompanyContext } from "@/lib/access";

export default async function TemplatesPage() {
  const ctx = await requireCompanyContext();
  const templates = await listTemplates(ctx);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Szablony skierowań</h1>
        <Button asChild>
          <Link href="/templates/new">Dodaj szablon</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nazwa</TableHead>
            <TableHead>Liczba czynników</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell>{template.name}</TableCell>
              <TableCell>{template._count.factors}</TableCell>
              <TableCell className="space-x-2 text-right">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/templates/${template.id}/edit`}>Edytuj</Link>
                </Button>
                <ConfirmButton question={`Usunąć szablon „${template.name}”?`} action={deleteTemplateAction.bind(null, template.id)}>
                  Usuń
                </ConfirmButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {templates.length === 0 && <p className="text-muted-foreground">Brak szablonów.</p>}
    </>
  );
}
