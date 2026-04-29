// @spec: submit-registration
// @urs: FR-01
// @risk_zone: 1

import { requireAuth } from "@/lib/auth/server";
import { connection } from "next/server";
import { SubmitRegistrationForm } from "@/features/registrations/_components/SubmitRegistrationForm";

export default async function RegisterPage() {
  await connection();
  await requireAuth();

  // For v1 the selfie URL is captured server-side via Supabase Storage
  // signed upload. For this page render the form with a placeholder URL —
  // a follow-on commit will wire up the storage upload widget.
  const placeholderSelfieUrl = "https://storage.example/sims/placeholder.jpg";

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Register your SIM</h1>
        <p className="text-sm text-muted-foreground">
          We need your NIK and KK to comply with Kominfo PP No. 28/2017.
          Your data is encrypted at rest.
        </p>
      </div>
      <SubmitRegistrationForm selfieUrl={placeholderSelfieUrl} />
    </div>
  );
}
