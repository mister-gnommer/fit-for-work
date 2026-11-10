-- CreateTable
CREATE TABLE "employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "sex" TEXT NOT NULL,
    "pesel" TEXT,
    "idDocumentName" TEXT,
    "idDocumentNumber" TEXT,
    "birthDate" TEXT,
    "city" TEXT NOT NULL,
    "street" TEXT,
    "buildingNumber" TEXT NOT NULL,
    "flatNumber" TEXT,
    "position" TEXT NOT NULL,
    "workDescription" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "employee_companyId_idx" ON "employee"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_companyId_pesel_key" ON "employee"("companyId", "pesel") WHERE deletedAt IS NULL;
