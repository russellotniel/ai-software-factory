// @spec: submit-registration
// @urs: FR-01
// @risk_zone: 1

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
    <div className="mx-auto flex w-full max-w-md flex-col gap-8">
      <header className="flex flex-col gap-3">
        <Badge variant="secondary" className="self-start">
          FR-01 · Risk Zone 1
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          Register your SIM
        </h1>
        <p className="text-sm text-muted-foreground">
          We need your NIK and KK to comply with Kominfo PP No. 28/2017.
          Your data is encrypted at rest using AES-256, never logged, and
          only your assigned dealer can see your submission.
        </p>
      </header>

      <SubmitRegistrationForm selfieUrl={placeholderSelfieUrl} />
    </div>
  );
}
