import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type TempDatabase = { directory: string; url: string; remove: () => Promise<void> };

/**
 * Creates a SQLite file in a fresh temporary directory and applies the repository migrations,
 * so integration tests never touch the developer database.
 */
export async function createMigratedDatabase(): Promise<TempDatabase> {
  const directory = await mkdtemp(join(tmpdir(), "fit-for-work-db-"));
  const url = `file:${join(directory, "test.db")}`;
  execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });
  return { directory, url, remove: () => rm(directory, { recursive: true, force: true }) };
}
