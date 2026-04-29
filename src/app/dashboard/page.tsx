import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          SIM Registration Portal — XLSmart
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-2">Quick actions</h3>
        <ul className="space-y-2 text-sm">
          <li>
            <Link
              href="/register"
              className="text-foreground underline underline-offset-4"
            >
              Submit a SIM registration (FR-01)
            </Link>{" "}
            — for Customer role
          </li>
          <li className="text-muted-foreground">
            View own status (FR-03) — coming next
          </li>
          <li className="text-muted-foreground">
            Dealer review queue (FR-04) — coming next
          </li>
        </ul>
      </div>
    </div>
  );
}
