import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { expect, test } from "vitest";

import { PrismaClient } from "@/generated/prisma/client";
import { createMigratedDatabase } from "@/test/temp-database";

test("SQLite data survives reconnecting to an isolated migrated database", async () => {
  const { directory, url, remove } = await createMigratedDatabase();
  const client = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

  try {
    // Isolate the cached server client and contain any wrong relative database path.
    execFileSync(process.execPath, ["--conditions=react-server", "--import", import.meta.resolve("tsx"), "--input-type=module"], {
      cwd: directory,
      env: {
        ...process.env,
        DATABASE_URL: url,
        TSX_TSCONFIG_PATH: resolve("tsconfig.json"),
      },
      input: `
        const { db } = await import(${JSON.stringify(pathToFileURL(resolve("src/lib/db.ts")).href)});
        try {
          await db.$executeRaw\`CREATE TABLE setup_probe (id INTEGER PRIMARY KEY, value TEXT NOT NULL)\`;
          await db.$executeRaw\`INSERT INTO setup_probe (id, value) VALUES (1, 'synthetic')\`;
        } finally {
          await db.$disconnect();
        }
      `,
      stdio: "pipe",
    });
    // After seeding: setup_probe has 1 row (id=1, value="synthetic").

    const rows = await client.$queryRaw<{ value: string }[]>`SELECT value FROM setup_probe WHERE id = 1`;
    expect(rows).toEqual([{ value: "synthetic" }]);
  } finally {
    try {
      await client.$disconnect();
    } finally {
      await remove();
    }
  }
});
