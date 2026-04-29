import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  size?: number;
};

/**
 * SIMREG mark — a stylized SIM card cut-corner with an embedded check.
 * Pure SVG, no asset deps. Inherits text color so it works on any surface.
 */
export function Logo({ className, size = 28 }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn("text-foreground", className)}
      aria-hidden="true"
    >
      <path
        d="M9 2 L26 2 A4 4 0 0 1 30 6 L30 26 A4 4 0 0 1 26 30 L6 30 A4 4 0 0 1 2 26 L2 9 Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="9"
        y="9"
        width="14"
        height="10"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M11 23 L14.5 26 L21 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
