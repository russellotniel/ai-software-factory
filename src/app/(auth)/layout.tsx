import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="surface-paper relative flex min-h-screen flex-col">
      <header className="relative z-10 px-8 py-6">
        <Link href="/" className="inline-flex items-center gap-3">
          <Logo size={28} />
          <span className="font-heading text-lg font-semibold tracking-tight">
            SIMREG
          </span>
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md rise-in">{children}</div>
      </main>

      <footer className="relative z-10 px-8 py-6 text-xs text-muted-foreground">
        <p>
          XLSmart Telecommunication Group · Kominfo PP No. 28/2017
        </p>
      </footer>
    </div>
  );
}
