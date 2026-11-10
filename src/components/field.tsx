import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FieldProps = ComponentProps<typeof Input> & { name: string; label: string; error?: string };

/** A labelled input with its validation message underneath. */
export function Field({ name, label, error, ...props }: FieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} aria-invalid={error ? true : undefined} {...props} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
