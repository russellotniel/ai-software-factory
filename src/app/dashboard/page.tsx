import Link from "next/link";
import { ArrowUpRight, FileCheck2, Lock, Scale, Users2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type FeatureCard = {
  title: string;
  description: string;
  ursId: string;
  zone: 1 | 2 | 3;
  status: "available" | "next" | "later";
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  span?: string;
};

const features: FeatureCard[] = [
  {
    title: "Submit a registration",
    description:
      "NIK, KK and selfie. Encrypted at rest, region resolved server-side, queued to your dealer.",
    ursId: "FR-01",
    zone: 1,
    status: "available",
    href: "/register",
    icon: FileCheck2,
    span: "md:col-span-2 md:row-span-2",
  },
  {
    title: "View my status",
    description: "Track pending, approved or rejected submissions in real time.",
    ursId: "FR-03",
    zone: 1,
    status: "next",
    icon: Users2,
  },
  {
    title: "Dealer queue",
    description: "Region-scoped review queue with single-action approve / reject.",
    ursId: "FR-04 / 05 / 06",
    zone: 1,
    status: "later",
    icon: Scale,
  },
  {
    title: "Audit trail",
    description: "Append-only, hashed PII. 5-year retention per Kominfo regulation.",
    ursId: "FR-09",
    zone: 1,
    status: "later",
    icon: Lock,
  },
];

const statusLabel: Record<FeatureCard["status"], string> = {
  available: "Available",
  next: "Coming next",
  later: "Roadmap",
};

const statusVariant: Record<
  FeatureCard["status"],
  "default" | "secondary" | "outline"
> = {
  available: "default",
  next: "secondary",
  later: "outline",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-4 rise-in">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          <span>SIMREG</span>
          <span aria-hidden>·</span>
          <span>v0.1 draft</span>
          <span aria-hidden>·</span>
          <span className="text-accent-foreground">Kominfo PP No. 28/2017</span>
        </div>
        <h1 className="font-heading text-5xl font-semibold leading-[1.02] tracking-tight md:text-6xl">
          Register a SIM,<br />
          <em className="not-italic text-primary">verifiable end-to-end</em>.
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          XLSmart&apos;s prepaid registration portal — the same flow your dealer
          would run, on a system that shows its working from URS to test. Every
          card below is a feature traced to its requirement.
        </p>
      </header>

      <section className="rise-in" style={{ animationDelay: "120ms" }}>
        <div className="grid auto-rows-[minmax(160px,auto)] gap-4 md:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            const isInteractive = f.status === "available" && f.href;
            const cardClass = cn(
              "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 transition-colors",
              f.span,
              isInteractive &&
                "hover:border-primary/40 hover:shadow-[0_8px_30px_-12px_oklch(0.30_0.08_270/0.25)]",
            );
            const inner = (
              <>
                <div
                  className={cn(
                    "pointer-events-none absolute -right-8 -top-8 size-32 rounded-full opacity-60 blur-2xl transition-opacity",
                    f.status === "available" ? "bg-accent" : "bg-secondary",
                  )}
                  aria-hidden
                />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    <Icon className="size-6 text-primary" aria-hidden />
                    <h2 className="font-heading text-2xl font-semibold leading-[1.1] tracking-tight">
                      {f.title}
                    </h2>
                    <p className="max-w-[36ch] text-sm leading-relaxed text-muted-foreground">
                      {f.description}
                    </p>
                  </div>
                  {isInteractive && (
                    <ArrowUpRight
                      className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden
                    />
                  )}
                </div>
                <div className="relative mt-6 flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant={statusVariant[f.status]}>
                    {statusLabel[f.status]}
                  </Badge>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {f.ursId} · Zone {f.zone}
                  </span>
                </div>
              </>
            );
            return isInteractive ? (
              <Link key={f.title} href={f.href!} className={cardClass}>
                {inner}
              </Link>
            ) : (
              <div key={f.title} className={cardClass}>
                {inner}
              </div>
            );
          })}
        </div>
      </section>

      <section
        className="rise-in grid gap-4 md:grid-cols-3"
        style={{ animationDelay: "200ms" }}
      >
        <ComplianceTile
          label="Encryption at rest"
          value="AES-256"
          note="NIK + KK columns, deterministic for exact-match search"
          urs="NFR-01"
        />
        <ComplianceTile
          label="Audit retention"
          value="5 years"
          note="Append-only, never deleted, hashed PII"
          urs="NFR-02"
        />
        <ComplianceTile
          label="Approval latency"
          value="< 2s p95"
          note="Dealer decision → state transition → audit entry"
          urs="NFR-03"
        />
      </section>
    </div>
  );
}

function ComplianceTile({
  label,
  value,
  note,
  urs,
}: {
  label: string;
  value: string;
  note: string;
  urs: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/40 p-5">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="font-heading text-3xl font-semibold tracking-tight">
        {value}
      </p>
      <p className="text-xs leading-relaxed text-muted-foreground">{note}</p>
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {urs}
      </span>
    </div>
  );
}
