import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listReferrals } from "@/features/referrals/service";
import { requireCompanyContext } from "@/lib/access";
import { examTypeLabels, referralStatusLabels } from "@/lib/labels";

export default async function ReferralsPage() {
  const ctx = await requireCompanyContext();
  const referrals = await listReferrals(ctx);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Skierowania</h1>
        <Button asChild>
          <Link href="/referrals/new">Nowe skierowanie</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pracownik</TableHead>
            <TableHead>Rodzaj badania</TableHead>
            <TableHead>Wystawiono</TableHead>
            <TableHead>Termin</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {referrals.map((referral) => (
            <TableRow key={referral.id}>
              <TableCell>{referral.employeeName}</TableCell>
              <TableCell>{examTypeLabels[referral.examType]}</TableCell>
              <TableCell>{referral.issueDate}</TableCell>
              <TableCell>{referral.deadline}</TableCell>
              <TableCell>{referralStatusLabels[referral.status]}</TableCell>
              <TableCell className="space-x-2 text-right">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/referrals/${referral.id}`}>Szczegóły</Link>
                </Button>
                {/* A plain link: the route returns the file as a download. */}
                <Button asChild variant="outline" size="sm">
                  <a href={`/referrals/${referral.id}/pdf`}>Pobierz PDF</a>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {referrals.length === 0 && <p className="text-muted-foreground">Brak skierowań.</p>}
    </>
  );
}
