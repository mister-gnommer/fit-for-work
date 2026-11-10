import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import type { Role } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

// Better Auth only signs users in and manages sessions. It has no route handler, so none of
// its HTTP endpoints (sign-up, update-user, change-password) are reachable. Accounts are
// created and passwords set by the functions below.
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { deletedAt: true, company: { select: { deletedAt: true } } },
          });
          if (!user || user.deletedAt || user.company?.deletedAt) {
            return false;
          }
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type NewAccount = {
  name: string;
  email: string;
  password: string;
  role: Role;
  companyId: string | null;
};

/**
 * Creates a user with an email/password login in one transaction, in the shape Better Auth
 * signs in: a `credential` account whose `accountId` is the user's id.
 * @returns the new user's id
 */
export async function createUserWithPassword(account: NewAccount): Promise<string> {
  // The schema can't express "HR users need a company", so every creation path goes through this check.
  if (account.role !== "TELEMEDI" && !account.companyId) {
    throw new Error(`A ${account.role} account must belong to a company`);
  }
  const hash = await (await auth.$context).password.hash(account.password);
  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: account.name,
        email: account.email.trim().toLowerCase(),
        role: account.role,
        companyId: account.companyId,
      },
    });
    await tx.account.create({
      data: { userId: user.id, accountId: user.id, providerId: "credential", password: hash },
    });
    return user.id;
  });
}

/** Replaces the user's password and ends all their sessions. */
export async function setUserPassword(userId: string, password: string): Promise<void> {
  const hash = await (await auth.$context).password.hash(password);
  await db.$transaction([
    db.account.updateMany({ where: { userId, providerId: "credential" }, data: { password: hash } }),
    db.session.deleteMany({ where: { userId } }),
  ]);
}
