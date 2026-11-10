import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { Role } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const COMPANY_COOKIE = "companyId";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string | null;
};

/** The company every company-scoped query must filter by, plus who is asking. */
export type CompanyContext = { user: CurrentUser; companyId: string };

/**
 * The logged-in user, re-read from the database on every request so that deleting a user or
 * their company takes effect immediately.
 * @returns the user, or null when logged out, deleted, or their company is deleted
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return null;
  }
  return db.user.findFirst({
    where: {
      id: session.user.id,
      deletedAt: null,
      OR: [{ companyId: null }, { company: { deletedAt: null } }],
    },
    select: { id: true, name: true, email: true, role: true, companyId: true },
  });
});

/** The logged-in user; redirects to the login page otherwise. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/** The logged-in Telemedi user; anyone else is sent to their start page. */
export async function requireTelemedi(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== Role.TELEMEDI) {
    redirect("/");
  }
  return user;
}

/**
 * The company Telemedi picked in the switcher, if it still exists and isn't deleted.
 * A stale or tampered cookie counts as no selection.
 */
export const getSelectedCompanyId = cache(async (): Promise<string | null> => {
  const selected = (await cookies()).get(COMPANY_COOKIE)?.value;
  if (!selected) {
    return null;
  }
  const company = await db.company.findFirst({ where: { id: selected, deletedAt: null }, select: { id: true } });
  return company?.id ?? null;
});

/**
 * The company context for company-scoped pages and actions. HR users always get their own
 * company, regardless of any input. Telemedi gets the switcher's company, or is sent to the
 * company list to pick one.
 */
export async function requireCompanyContext(): Promise<CompanyContext> {
  const user = await requireUser();
  if (user.role !== Role.TELEMEDI) {
    if (!user.companyId) {
      // HR rows are always created with a company; treat a broken row as logged out.
      redirect("/login");
    }
    return { user, companyId: user.companyId };
  }
  const companyId = await getSelectedCompanyId();
  if (!companyId) {
    redirect("/companies");
  }
  return { user, companyId };
}
