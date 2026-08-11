"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Compass } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { MarketCard } from "@/components/markets/market-card";
import { MarketCardSkeleton } from "@/components/markets/market-card-skeleton";
import { useMarkets } from "@/hooks/use-markets";
import { CATEGORIES } from "@/lib/solana/constants";
import { getMarketPhase } from "@/lib/solana/market";

const FILTERS = ["All", ...CATEGORIES] as const;
type Filter = (typeof FILTERS)[number];

const PHASE_ORDER = { live: 0, upcoming: 1, ended: 2, resolved: 3 } as const;

export function MarketExplorer() {
  const { markets, loading, error, refresh } = useMarkets();
  const [filter, setFilter] = useState<Filter>("All");

  const filtered = useMemo(() => {
    if (!markets) return [];
    const scoped = filter === "All" ? markets : markets.filter((m) => m.category === filter);
    return [...scoped].sort((a, b) => {
      const phaseDiff = PHASE_ORDER[getMarketPhase(a)] - PHASE_ORDER[getMarketPhase(b)];
      if (phaseDiff !== 0) return phaseDiff;
      return a.endTime.toNumber() - b.endTime.toNumber();
    });
  }, [markets, filter]);

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          {FILTERS.map((f) => (
            <TabsTrigger key={f} value={f}>
              {f}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error ? (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load markets"
          description={error}
          action={{ label: "Retry", onClick: refresh }}
        />
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <MarketCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No markets here yet"
          description={
            filter === "All"
              ? "No markets have been created on this program yet. Check back soon."
              : `No ${filter.toLowerCase()} markets right now — try another category.`
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((market) => (
            <MarketCard key={market.publicKey.toBase58()} market={market} />
          ))}
        </div>
      )}
    </div>
  );
}
