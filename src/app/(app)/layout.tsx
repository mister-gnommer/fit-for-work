import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";
import { CompanySwitcher } from "@/features/companies/company-switcher";
import { listCompanies } from "@/features/companies/service";
import { getSelectedCompanyId, requireUser } from "@/lib/access";
import { roleLabels } from "@/lib/labels";

// Only renders the shell. Every page and action checks access itself, because layouts
// don't re-render on client navigation.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const isTelemedi = user.role === "TELEMEDI";
  const companies = isTelemedi ? await listCompanies() : [];
  const selectedId = isTelemedi ? await getSelectedCompanyId() : null;

  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-8 py-3">
          <Link href="/" className="font-semibold">
            Fit for Work
          </Link>
          <nav className="flex gap-4 text-sm">
            {isTelemedi && <Link href="/companies">Firmy</Link>}
            {(!isTelemedi || selectedId) && <Link href="/users">Użytkownicy</Link>}
          </nav>
          <div className="ml-auto flex items-center gap-4 text-sm">
            {isTelemedi && <CompanySwitcher companies={companies} selectedId={selectedId} />}
            <span>
              {user.name} <span className="text-muted-foreground">({roleLabels[user.role]})</span>
            </span>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                Wyloguj
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-6 px-8 py-8">{children}</main>
    </>
  );
}
