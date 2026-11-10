import "server-only";

import { readFile } from "node:fs/promises";

import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { RiskCategory } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

// Relative to the working directory: scripts, tests and the container (/app) run from the repo root.
const PREDEFINED_FILE = "docs/seed/risk-factors.json";

const predefinedSchema = z.array(z.object({ category: z.enum(RiskCategory), name: z.string().trim().min(1) }));

/**
 * Inserts every predefined factor from the seed file that isn't in the database yet. Never
 * updates or deletes, so existing rows (and later references to them) stay as they are.
 * @returns how many factors were added
 */
export async function ensurePredefinedRiskFactors(): Promise<number> {
  const factors = predefinedSchema.parse(JSON.parse(await readFile(PREDEFINED_FILE, "utf8")));
  try {
    return await insertMissing(factors);
  } catch (error) {
    // Another seed run inserted some of them at the same time (unique index on predefined names).
    // One more pass skips what it added; a second failure is a real problem and propagates.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return insertMissing(factors);
    }
    throw error;
  }
}

/** Inserts the factors that have no predefined row yet; returns how many it inserted. */
async function insertMissing(factors: z.infer<typeof predefinedSchema>): Promise<number> {
  const existing = await db.riskFactor.findMany({ where: { companyId: null }, select: { category: true, name: true } });
  const known = new Set(existing.map((factor) => `${factor.category}\n${factor.name}`));
  const missing = factors.filter((factor) => !known.has(`${factor.category}\n${factor.name}`));
  await db.riskFactor.createMany({ data: missing });
  return missing.length;
}
