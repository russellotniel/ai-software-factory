import { SignupForm } from "./_components/signup-form";

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-foreground">
          Get started
        </p>
        <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight">
          Create your<br />
          <em className="not-italic text-primary">customer account</em>.
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          One account per customer. Your assigned dealer is determined by the
          region you choose below — it&apos;s used to route your registration
          and cannot be changed without admin approval.
        </p>
      </header>

      <div className="rounded-2xl border border-border bg-card/85 p-6 shadow-[0_1px_0_0_oklch(1_0_0/0.6),0_8px_30px_-10px_oklch(0.18_0.02_270/0.18)] backdrop-blur-sm">
        <SignupForm />
      </div>
    </div>
  );
}
