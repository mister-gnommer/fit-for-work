# Data model (draft for review)

Prisma 7 on SQLite. Field names are in English and the UI labels in Polish. "?" marks an optional field.

## Conventions

- `id`: `String @id @default(cuid())`, the Prisma default. Every table has `createdAt` and `updatedAt`. Sort by `createdAt`, not by `id`.
- `deletedAt?` marks a soft delete. The table is hidden in the UI when it's set. All deletable tables have it.
- Company scoping: every company-owned table has `companyId`. All reads and writes go through one server-side helper that adds the filter.
- Partial unique indexes (`… WHERE deletedAt IS NULL`) are declared in the schema with `@@unique([...], where: raw("..."))`, behind the `partialIndexes` preview feature. Don't hand-write them in migration SQL, or later migrations will drop them as drift. Check that the generated SQL keeps the `WHERE`.

## Enums

| Enum | Values |
|---|---|
| `Role` | `TELEMEDI`, `ADMIN`, `OPERATOR` |
| `RiskCategory` | `PHYSICAL`, `DUSTS`, `CHEMICAL`, `BIOLOGICAL`, `OTHER` (the form's I–V) |
| `ExamType` | `PRE_EMPLOYMENT`, `PERIODIC`, `FOLLOW_UP` |
| `ReferralStatus` | `CREATED`, `IN_PROGRESS`, `CONFIRMED`, `DONE`, `CANCELLED` |
| `Sex` | `FEMALE`, `MALE` (only used to strike through the gendered words on the form) |
| `EmploymentStatus` | `EMPLOYED`, `TAKING_UP_WORK` |

## Entities

### Company
The employer. Its details are printed on the form.
- `name`
- `city`, `street?`, `buildingNumber`, `flatNumber?`, `postalCode`. `city` is also the place of issue (Q11).
- `nip`: required, checksum-validated
- `deletedAt?`. Only Telemedi can delete a company.

### User
Better Auth's `user` table with extra fields. Better Auth also generates `session`, `account` (which stores the password hash) and `verification`.
- `name`, `email`, plus Better Auth's own fields
- `role: Role`
- `companyId?`: empty only for `TELEMEDI`
- `deletedAt?`. Deleted users can't log in.
- One admin per company: a partial unique index on `companyId WHERE role = 'ADMIN' AND deletedAt IS NULL`.

### Employee
- `companyId`
- `firstName`, `lastName`, `sex: Sex`
- `pesel?`. If it's missing, `idDocumentName`, `idDocumentNumber` (series and number) and `birthDate` are required (Q4). The PESEL checksum is validated.
- `birthDate` is a `yyyy-MM-dd` string, not a `DateTime`: it's a calendar date with no time, and both the date input and the referral snapshot use that format. It's cleared when a PESEL is given.
- `city`, `street?`, `buildingNumber`, `flatNumber?`. The form asks for town, street, building and flat (Q12).
- `position`, `workDescription` (Q3, Q9)
- `deletedAt?`
- A partial unique index on `(companyId, pesel) WHERE deletedAt IS NULL`. SQLite treats NULLs as distinct, so employees without a PESEL never collide.

### RiskFactor
- `category: RiskCategory`
- `name`
- `companyId?`: empty for predefined factors, which are seeded and read-only. Set for a company's own factors.
- `deletedAt?`. Only a company's own factors can be deleted.

### ReferralTemplate
- `companyId`
- `name`
- `deletedAt?`

### ReferralTemplateFactor
- `templateId`, `riskFactorId`, with `(templateId, riskFactorId)` unique
- `exposureLevel?`
- Hard deleted when a factor is removed from a template, so it gets no `deletedAt`. If the factor itself is soft deleted, it disappears from every template that uses it.

### Referral
- `companyId`
- `employeeId`: the link stays even if the employee is deleted. The list reads its data from the snapshot.
- `createdById`: the user who created the referral
- `examType: ExamType`
- `status: ReferralStatus`, default `CREATED`. Only Telemedi changes it.
- `deadline`: a date
- `snapshot: Json`, frozen when the referral is created. The PDF is rendered from it.
- `deletedAt?`. Only Telemedi can delete a referral.
- `createdAt` is the issue date that goes on the form.

The snapshot holds everything printed on the form:
- the employer's name and address
- the employee's full name and sex
- the PESEL, or the ID document and birth date
- the home address
- employed or taking up work
- the position and the work description
- the factors grouped by category, each with a name and an optional exposure level
- the total number of factors
- the place and date of issue

It's described by a TypeScript type and checked with a schema when written.

The fields that are also stored as columns (`examType`, `status`, `deadline`, `employeeId`) are the ones we filter and sort on.

## Decided in review (ledger Q14–Q18)

- Enum values are in English. Polish labels, using the official wording, live in one labels file.
- A deleted user's email can't be reused, because Better Auth keeps a plain unique index on `email`. Only the PESEL uniqueness rule ignores deleted records.
- NIP is required and checksum-validated.
- Street is optional for both companies and employees.
- Referrals have no human-readable number. This is listed as an open product question in README.
