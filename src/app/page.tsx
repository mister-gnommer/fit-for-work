import { Card, CardDescription, CardHeader } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-8 py-16">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold">Fit for Work</h1>
          <CardDescription>Skierowania na badania medycyny pracy</CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}
