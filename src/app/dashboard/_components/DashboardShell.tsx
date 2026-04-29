"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  user: { id: string; email: string };
  children: React.ReactNode;
};

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Submit registration", href: "/register" },
];

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r border-border bg-muted/20">
        <div className="flex h-16 items-center px-6">
          <Link
            href="/dashboard"
            className="flex flex-col leading-tight"
          >
            <span className="text-base font-bold tracking-tight">
              SIM Registration
            </span>
            <span className="text-xs text-muted-foreground">
              XLSmart Telco · Kominfo-compliant
            </span>
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{user.email}</p>
              <p className="truncate text-xs text-muted-foreground">
                Customer
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="mt-3 w-full justify-start text-muted-foreground hover:text-foreground"
          >
            Sign out
          </Button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-8 py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
