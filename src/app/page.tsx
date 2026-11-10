import { redirect } from "next/navigation";

import { requireUser } from "@/lib/access";
import { startPath } from "@/lib/permissions";

export default async function Home() {
  const user = await requireUser();
  redirect(startPath(user.role));
}
