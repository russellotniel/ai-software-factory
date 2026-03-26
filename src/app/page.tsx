export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-2xl flex-col items-center justify-center gap-8 px-8 py-16">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
            AI Software Factory
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Full-lifecycle development framework for Next.js + Supabase
          </p>
        </div>

        <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
            Get Started
          </h2>
          <ol className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                1
              </span>
              <span>
                Open Claude Code in this directory
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                2
              </span>
              <span>
                Run{" "}
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
                  /foundation:init
                </code>{" "}
                to configure your project
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                3
              </span>
              <span>
                Run{" "}
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
                  /foundation:discover
                </code>{" "}
                to document your product
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                4
              </span>
              <span>
                Run{" "}
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
                  /foundation:plan
                </code>{" "}
                to plan your features
              </span>
            </li>
          </ol>
        </div>

        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          See{" "}
          <code className="font-mono">.claude/docs/workflows.md</code> for the
          full development workflow.
        </p>
      </main>
    </div>
  );
}
