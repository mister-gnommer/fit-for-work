"use client";

import Link from "next/link";

// Services throw NotFoundError/ForbiddenError for records outside the user's reach; in
// production Next hides the error details, so one generic Polish message covers everything.
export default function ErrorPage() {
  return (
    <main className="mx-auto max-w-xl px-8 py-16">
      <h1 className="text-2xl font-semibold">Coś poszło nie tak</h1>
      <p className="mt-2 text-muted-foreground">Rekord nie istnieje, został usunięty albo nie masz do niego dostępu.</p>
      <Link href="/" className="mt-4 inline-block underline">
        Wróć na stronę główną
      </Link>
    </main>
  );
}
