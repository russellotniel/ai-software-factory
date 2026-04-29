// @spec: submit-registration
// @urs: FR-01
// @risk_zone: 1

import { Lock, ShieldCheck, Stamp } from "lucide-react";
import { requireAuth } from "@/lib/auth/server";
import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { SubmitRegistrationForm } from "@/features/registrations/_components/SubmitRegistrationForm";

export default async function RegisterPage() {
  await connection();
  await requireAuth();

  // For v1 the selfie URL is captured server-side via Supabase Storage
  // signed upload. For this page render the form with a placeholder URL —
  // a follow-on commit will wire up the storage upload widget.
  const placeholderSelfieUrl = "https://storage.example/sims/placeholder.jpg";

  return (
    <div className="grid gap-12 md:grid-cols-[1fr_minmax(0,420px)] md:items-start">
      <aside className="flex flex-col gap-6 rise-in">
        <Badge variant="secondary" className="self-start">
          FR-01 · Risk Zone 1
        </Badge>
        <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
          Register your SIM,<br />
          <em className="not-italic text-primary">privately</em>.
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          Three regulator-required identifiers, one short form. Your data is
          encrypted before it lands in the database, auto-routed to the dealer
          for your region, and never displayed in plaintext to anyone but you.
        </p>

        <ul className="flex flex-col gap-4 rounded-xl border border-border bg-card/60 p-5 text-sm">
          <Trait
            icon={Lock}
            title="Encrypted at rest"
            note="AES-256 with deterministic IV — NFR-01"
          />
          <Trait
            icon={ShieldCheck}
            title="Region-scoped"
            note="Only your assigned dealer can see your row — UR-02"
          />
          <Trait
            icon={Stamp}
            title="Auditable forever"
            note="Every state change writes an immutable log entry — VR-01"
          />
        </ul>
      </aside>

      <div
        className="rise-in rounded-2xl border border-border bg-card p-6 shadow-[0_1px_0_0_oklch(1_0_0/0.6),0_8px_30px_-12px_oklch(0.18_0.02_270/0.18)]"
        style={{ animationDelay: "120ms" }}
      >
        <SubmitRegistrationForm selfieUrl={placeholderSelfieUrl} />
      </div>
    </div>
  );
}

function Trait({
  icon: Icon,
  title,
  note,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  note: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="flex flex-col">
        <span className="font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{note}</span>
      </div>
    </li>
  );
}
