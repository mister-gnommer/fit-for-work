import { Role } from "@/generated/prisma/enums";

export type Account = { id: string; role: Role; companyId: string | null };

/**
 * Whether the actor may create an account with this role in their current company context.
 * Telemedi creates admins and operators; an admin only operators. The one-admin-per-company
 * rule is enforced by the database.
 */
export function canCreateUser(actor: Account, role: Role): boolean {
  if (actor.role === Role.TELEMEDI) {
    return role !== Role.TELEMEDI;
  }
  return actor.role === Role.ADMIN && role === Role.OPERATOR;
}

/** Whether the actor may set a new password for the target account. */
export function canSetPassword(actor: Account, target: Account): boolean {
  if (target.role === Role.TELEMEDI) {
    return false;
  }
  if (actor.role === Role.TELEMEDI) {
    return true;
  }
  return isAdminOfOperator(actor, target);
}

/** Whether the actor may soft delete the target account. Operators may delete only themselves. */
export function canDeleteUser(actor: Account, target: Account): boolean {
  if (target.role === Role.TELEMEDI) {
    return false;
  }
  if (actor.role === Role.TELEMEDI) {
    return true;
  }
  if (actor.role === Role.OPERATOR) {
    return actor.id === target.id;
  }
  return isAdminOfOperator(actor, target);
}

/** The page a user lands on after login and when opening `/`. */
export function startPath(role: Role): string {
  return role === Role.TELEMEDI ? "/companies" : "/users";
}

function isAdminOfOperator(actor: Account, target: Account): boolean {
  return actor.role === Role.ADMIN && target.role === Role.OPERATOR && actor.companyId === target.companyId;
}
