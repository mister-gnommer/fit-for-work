import { Button } from "@/components/ui/button";
import { getReferral } from "@/features/referrals/service";
import { requireCompanyContext } from "@/lib/access";
import { employmentStatusLabels, examTypeLabels, referralStatusLabels } from "@/lib/labels";

export default async function ReferralPage({ params }: PageProps<"/referrals/[id]">) {
  const ctx = await requireCompanyContext();
  const { id, status, deadline, snapshot } = await getReferral(ctx, (await params).id);

  const rows: [string, string][] = [
    ["Pracownik", `${snapshot.employee.firstName} ${snapshot.employee.lastName}`],
    ["Rodzaj badania", examTypeLabels[snapshot.examType]],
    ["Status zatrudnienia", employmentStatusLabels[snapshot.employmentStatus]],
    ["Stanowisko", snapshot.position],
    ["Liczba czynników szkodliwych", String(snapshot.factors.length)],
    ["Termin", deadline],
    ["Wystawiono", `${snapshot.issuePlace}, ${snapshot.issueDate}`],
    ["Status", referralStatusLabels[status]],
  ];

  return (
    <>
      <h1 className="text-2xl font-semibold">Skierowanie</h1>
      <dl className="grid max-w-xl grid-cols-[14rem_1fr] gap-x-4 gap-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div>
        {/* A plain link: the route returns the file as a download. */}
        <Button asChild>
          <a href={`/referrals/${id}/pdf`}>Pobierz PDF</a>
        </Button>
      </div>
    </>
  );
}
