-- CreateTable
CREATE TABLE "referral_template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "referral_template_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "referral_template_factor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "riskFactorId" TEXT NOT NULL,
    "exposureLevel" TEXT,
    CONSTRAINT "referral_template_factor_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "referral_template" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "referral_template_factor_riskFactorId_fkey" FOREIGN KEY ("riskFactorId") REFERENCES "risk_factor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "referral_template_companyId_idx" ON "referral_template"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "referral_template_companyId_name_key" ON "referral_template"("companyId", "name") WHERE deletedAt IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "referral_template_factor_templateId_riskFactorId_key" ON "referral_template_factor"("templateId", "riskFactorId");
