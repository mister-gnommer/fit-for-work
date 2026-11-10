"use client";

import { useActionState } from "react";

import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/forms";

import { saveCompanyAction } from "./actions";

type CompanyValues = {
  name: string;
  city: string;
  street: string | null;
  buildingNumber: string;
  flatNumber: string | null;
  postalCode: string;
  nip: string;
};

/** Create/edit form for a company's employer details. */
export function CompanyForm({ companyId, company }: { companyId: string | null; company?: CompanyValues }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCompanyAction.bind(null, companyId), {});
  const value = (field: keyof CompanyValues) => state.values?.[field] ?? company?.[field] ?? "";
  const error = (field: keyof CompanyValues) => state.errors?.[field];

  return (
    <form action={action} className="grid max-w-xl gap-4">
      <Field name="name" label="Nazwa" defaultValue={value("name")} error={error("name")} required />
      <Field name="nip" label="NIP" defaultValue={value("nip")} error={error("nip")} required />
      <Field name="street" label="Ulica (opcjonalnie)" defaultValue={value("street")} error={error("street")} />
      <div className="grid grid-cols-2 gap-4">
        <Field name="buildingNumber" label="Numer budynku" defaultValue={value("buildingNumber")} error={error("buildingNumber")} required />
        <Field name="flatNumber" label="Numer lokalu (opcjonalnie)" defaultValue={value("flatNumber")} error={error("flatNumber")} />
      </div>
      <div className="grid grid-cols-[10rem_1fr] gap-4">
        <Field name="postalCode" label="Kod pocztowy" placeholder="00-000" defaultValue={value("postalCode")} error={error("postalCode")} required />
        <Field name="city" label="Miejscowość" defaultValue={value("city")} error={error("city")} required />
      </div>
      <div>
        <Button type="submit" disabled={pending}>Zapisz</Button>
      </div>
    </form>
  );
}
