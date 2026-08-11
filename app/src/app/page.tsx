import { MarketExplorer } from "@/components/markets/market-explorer";

export default function HomePage() {
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
      <MarketExplorer />
    </div>
  );
}
