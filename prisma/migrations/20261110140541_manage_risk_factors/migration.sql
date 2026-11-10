-- CreateTable
CREATE TABLE "risk_factor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "risk_factor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "risk_factor_companyId_category_name_key" ON "risk_factor"("companyId", "category", "name") WHERE deletedAt IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "risk_factor_category_name_key" ON "risk_factor"("category", "name") WHERE companyId IS NULL;
