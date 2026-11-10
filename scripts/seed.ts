// Creates the first Telemedi account from TELEMEDI_* env vars when no Telemedi user exists.
// Runs at container start, so a missing configuration is logged rather than fatal.
import "dotenv/config";

import { createUserWithPassword, PASSWORD_MIN_LENGTH } from "@/lib/auth";
import { db } from "@/lib/db";

const { TELEMEDI_NAME, TELEMEDI_EMAIL, TELEMEDI_PASSWORD, BETTER_AUTH_SECRET } = process.env;

// The container runs this before the server, so a missing secret stops startup here.
if (!BETTER_AUTH_SECRET) {
  console.error("Seed: BETTER_AUTH_SECRET is not set. Refusing to start without an authentication secret.");
  process.exit(1);
}

try {
  if ((await db.user.count({ where: { role: "TELEMEDI", deletedAt: null } })) > 0) {
    console.log("Seed: a Telemedi account already exists, nothing to do.");
  } else if (!TELEMEDI_NAME || !TELEMEDI_EMAIL || !TELEMEDI_PASSWORD || TELEMEDI_PASSWORD.length < PASSWORD_MIN_LENGTH) {
    console.error(
      `Seed: no Telemedi account exists. Set TELEMEDI_NAME, TELEMEDI_EMAIL and TELEMEDI_PASSWORD (at least ${PASSWORD_MIN_LENGTH} characters) and restart.`,
    );
  } else {
    await createUserWithPassword({ name: TELEMEDI_NAME, email: TELEMEDI_EMAIL, password: TELEMEDI_PASSWORD, role: "TELEMEDI", companyId: null });
    console.log(`Seed: created Telemedi account ${TELEMEDI_EMAIL}.`);
  }
} finally {
  await db.$disconnect();
}
