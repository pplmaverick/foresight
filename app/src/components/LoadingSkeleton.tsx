"use client";

import { cn } from "@/lib/utils";

const SOLANA_PURPLE = "#9945FF";
const SOLANA_GREEN = "#14F195";

function Shimmer({
  className,
  delayMs = 0,
}: {
  className?: string;
  delayMs?: number;
}) {
  return (
    <div
      className={cn(
        "skeleton-shimmer rounded-md bg-slate-200 dark:bg-slate-800",
        className,
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    />
  );
}

function StatusDots() {
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      <span
        className="h-2 w-2 animate-bounce rounded-full"
        style={{ backgroundColor: SOLANA_PURPLE, animationDelay: "0ms" }}
      />
      <span
        className="h-2 w-2 animate-bounce rounded-full"
        style={{ backgroundColor: SOLANA_GREEN, animationDelay: "150ms" }}
      />
      <span
        className="h-2 w-2 animate-bounce rounded-full"
        style={{ backgroundColor: SOLANA_PURPLE, animationDelay: "300ms" }}
      />
    </div>
  );
}

function MetricCardSkeleton({ delayMs }: { delayMs: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
      <Shimmer className="mb-2 h-3 w-14" delayMs={delayMs} />
      <Shimmer className="h-5 w-20" delayMs={delayMs + 25} />
    </div>
  );
}

function MarketRowSkeleton({
  delayMs,
  className,
}: {
  delayMs: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900",
        className,
      )}
    >
      <Shimmer className="h-10 w-10 shrink-0 rounded-full" delayMs={delayMs} />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-4 w-3/4" delayMs={delayMs + 25} />
        <Shimmer className="h-3 w-1/3" delayMs={delayMs + 50} />
      </div>
      <Shimmer className="h-6 w-14 shrink-0 rounded-full" delayMs={delayMs + 75} />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="w-full space-y-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6"
    >
      {/* Header: title + status */}
      <div className="flex items-center justify-between gap-3">
        <Shimmer className="h-6 w-40" delayMs={0} />
        <StatusDots />
      </div>

      {/* Metrics: pool size / deadline / participants */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <MetricCardSkeleton delayMs={50} />
        <MetricCardSkeleton delayMs={100} />
        <MetricCardSkeleton delayMs={150} />
      </div>

      {/* Market list */}
      <div className="space-y-3">
        <MarketRowSkeleton delayMs={200} />
        <MarketRowSkeleton delayMs={300} />
        <MarketRowSkeleton delayMs={400} className="opacity-60" />
      </div>

      {/* CTA */}
      <Shimmer className="h-11 w-full rounded-lg" delayMs={500} />

      <span className="sr-only">Loading prediction markets…</span>

      <style jsx global>{`
        .skeleton-shimmer {
          background-image: linear-gradient(
            90deg,
            rgba(148, 163, 184, 0) 0%,
            rgba(153, 69, 255, 0.35) 35%,
            rgba(20, 241, 149, 0.35) 50%,
            rgba(153, 69, 255, 0.35) 65%,
            rgba(148, 163, 184, 0) 100%
          );
          background-size: 200% 100%;
          animation: skeleton-sweep 2s ease-in-out infinite;
        }
        .dark .skeleton-shimmer {
          background-image: linear-gradient(
            90deg,
            rgba(51, 65, 85, 0) 0%,
            rgba(153, 69, 255, 0.45) 35%,
            rgba(20, 241, 149, 0.45) 50%,
            rgba(153, 69, 255, 0.45) 65%,
            rgba(51, 65, 85, 0) 100%
          );
        }
        @keyframes skeleton-sweep {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .skeleton-shimmer {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

export default LoadingSkeleton;
