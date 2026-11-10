import { getReferral } from "@/features/referrals/service";
import { requireCompanyContext } from "@/lib/access";
import { NotFoundError } from "@/lib/errors";
import { renderReferralPdf } from "@/lib/referral-pdf/pdf";

/** Downloads the referral's official form, rendered from its frozen snapshot. */
export async function GET(_request: Request, { params }: RouteContext<"/referrals/[id]/pdf">) {
  // Logged-out visitors are redirected to /login; Telemedi without a selected company to /companies.
  const ctx = await requireCompanyContext();
  const referral = await getReferral(ctx, (await params).id).catch((error: unknown) => {
    if (error instanceof NotFoundError) {
      return null;
    }
    throw error;
  });
  if (!referral) {
    return new Response("Nie znaleziono skierowania.", { status: 404 });
  }

  const pdf = await renderReferralPdf(referral.snapshot);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="skierowanie-${referral.snapshot.issueDate}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
