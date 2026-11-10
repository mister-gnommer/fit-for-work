import { redirect } from "next/navigation";

import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/access";
import { startPath } from "@/lib/permissions";

import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(startPath(user.role));
  }

  return (
    <main className="mx-auto max-w-sm px-8 py-16">
      <Card className="px-6">
        <CardHeader className="px-0">
          <h1 className="text-2xl font-semibold">Fit for Work</h1>
          <CardDescription>Skierowania na badania medycyny pracy</CardDescription>
        </CardHeader>
        <LoginForm />
      </Card>
    </main>
  );
}
