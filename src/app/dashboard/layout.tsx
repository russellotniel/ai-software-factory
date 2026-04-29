import { requireAuth } from "@/lib/auth/server";
import { connection } from "next/server";
import { DashboardShell } from "./_components/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const { user } = await requireAuth();

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
