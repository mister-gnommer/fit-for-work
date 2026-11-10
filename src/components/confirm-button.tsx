"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";

/** A destructive button that asks for confirmation before running a server action. */
export function ConfirmButton({ question, action, children }: { question: string; action: () => Promise<void>; children: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (window.confirm(question)) {
          startTransition(action);
        }
      }}
    >
      {children}
    </Button>
  );
}
