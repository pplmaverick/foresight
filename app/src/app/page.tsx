"use client";

import { useEffect, useState } from "react";
import { MarketExplorer } from "@/components/markets/market-explorer";
import LoadingSkeleton from "@/components/LoadingSkeleton";

export default function HomePage() {
  // Demo: simulates a 3s initial load so LoadingSkeleton is visible before
  // MarketExplorer takes over with real data fetching.
  const [showSkeletonDemo, setShowSkeletonDemo] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSkeletonDemo(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 space-y-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Prediction Markets
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Trade on the outcome of real-world events. Every bet, pool, and payout is settled
          onchain.
        </p>
      </div>
      {showSkeletonDemo ? <LoadingSkeleton /> : <MarketExplorer />}
    </div>
  );
}
