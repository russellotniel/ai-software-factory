import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <Badge variant="secondary" className="self-start">
          SIMREG · v0.1
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          XLSmart prepaid SIM registration portal — Kominfo PP No. 28/2017
          compliant.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Submit a registration</CardTitle>
            <CardDescription>
              Customers register a new SIM with NIK + KK + selfie. Encrypted
              at rest, audit-logged on every state change.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link
              href="/register"
              className="text-sm font-medium underline underline-offset-4"
            >
              Open registration form →
            </Link>
            <p className="text-xs text-muted-foreground">
              FR-01 · Risk Zone 1 (Critical)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">View own status</CardTitle>
            <CardDescription>
              Customers track their pending / approved / rejected
              registrations.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Coming next</p>
            <p className="text-xs text-muted-foreground">
              FR-03 · Risk Zone 1 (Critical)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dealer review queue</CardTitle>
            <CardDescription>
              Dealers see only registrations from their assigned region.
              Approve or reject with mandatory reason.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Coming next</p>
            <p className="text-xs text-muted-foreground">
              FR-04, FR-05, FR-06 · Risk Zone 1 (Critical)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Audit log</CardTitle>
            <CardDescription>
              Auditor-only, append-only, hashed PII. Retained 5 years per
              regulation.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Coming next</p>
            <p className="text-xs text-muted-foreground">
              FR-09 · Risk Zone 1 (Critical)
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
