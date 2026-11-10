import "server-only";

import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { Role } from "@/generated/prisma/enums";
import type { CompanyContext } from "@/lib/access";
import { createUserWithPassword, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, setUserPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { requiredText, type ServiceResult } from "@/lib/forms";
import { canCreateUser, canDeleteUser, canSetPassword } from "@/lib/permissions";

export const passwordSchema = z
  .string("Podaj hasło.")
  .min(PASSWORD_MIN_LENGTH, `Hasło musi mieć co najmniej ${PASSWORD_MIN_LENGTH} znaków.`)
  .max(PASSWORD_MAX_LENGTH, `Hasło może mieć najwyżej ${PASSWORD_MAX_LENGTH} znaków.`);

export const newUserSchema = z.object({
  name: requiredText("Podaj imię i nazwisko."),
  email: z.string().trim().toLowerCase().pipe(z.email("Nieprawidłowy adres e-mail.")),
  password: passwordSchema,
  role: z.enum([Role.ADMIN, Role.OPERATOR], "Wybierz rolę."),
});

export type NewUserInput = z.infer<typeof newUserSchema>;

/** The company's users who aren't deleted, oldest first. */
export function listUsers(companyId: string) {
  return db.user.findMany({
    where: { companyId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, companyId: true },
  });
}

/** Whether the company has an admin who isn't deleted. */
export async function hasAdmin(companyId: string): Promise<boolean> {
  return (await db.user.count({ where: { companyId, role: Role.ADMIN, deletedAt: null } })) > 0;
}

/** Creates an admin or operator in the context's company. */
export async function createUser(ctx: CompanyContext, input: NewUserInput): Promise<ServiceResult> {
  if (!canCreateUser(ctx.user, input.role)) {
    throw new ForbiddenError();
  }
  // Deleted users keep their email, so this checks every user. Emails are stored lowercased.
  if (await db.user.findUnique({ where: { email: input.email.trim().toLowerCase() }, select: { id: true } })) {
    return { ok: false, errors: { email: "Ten adres e-mail jest już używany." } };
  }
  if (input.role === Role.ADMIN && (await hasAdmin(ctx.companyId))) {
    return { ok: false, errors: { role: "Ta firma ma już administratora." } };
  }
  try {
    await createUserWithPassword({ ...input, companyId: ctx.companyId });
    return { ok: true };
  } catch (error) {
    // Only reachable when two requests race past the checks above.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, errors: { form: "Ten adres e-mail lub rola administratora jest już zajęta." } };
    }
    throw error;
  }
}

/** A user of the context's company who isn't deleted, for showing or acting on. */
export async function getCompanyUser(ctx: CompanyContext, userId: string) {
  const user = await db.user.findFirst({
    where: { id: userId, companyId: ctx.companyId, deletedAt: null },
    select: { id: true, name: true, email: true, role: true, companyId: true },
  });
  if (!user) {
    throw new NotFoundError();
  }
  return user;
}

/** Sets a company user's password and ends their sessions. */
export async function changePassword(ctx: CompanyContext, userId: string, password: string): Promise<void> {
  const target = await getCompanyUser(ctx, userId);
  if (!canSetPassword(ctx.user, target)) {
    throw new ForbiddenError();
  }
  await setUserPassword(target.id, password);
}

/** Soft deletes a company user and ends their sessions. */
export async function deleteUser(ctx: CompanyContext, userId: string): Promise<void> {
  const target = await getCompanyUser(ctx, userId);
  if (!canDeleteUser(ctx.user, target)) {
    throw new ForbiddenError();
  }
  await db.$transaction([
    db.user.update({ where: { id: target.id }, data: { deletedAt: new Date() } }),
    db.session.deleteMany({ where: { userId: target.id } }),
  ]);
}
