"use client";

import { selectCompanyAction } from "./actions";

/** Telemedi's working-company select; submits as soon as a company is picked. */
export function CompanySwitcher({ companies, selectedId }: { companies: { id: string; name: string }[]; selectedId: string | null }) {
  return (
    <form action={selectCompanyAction}>
      <select
        name="companyId"
        aria-label="Firma"
        defaultValue={selectedId ?? ""}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-9 rounded-md border bg-background px-3 text-sm"
      >
        <option value="" disabled>
          Wybierz firmę…
        </option>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>
    </form>
  );
}
