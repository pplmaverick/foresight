"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { PhaseBadge } from "@/components/markets/phase-badge";
import { useMarkets } from "@/hooks/use-markets";
import { useProgram } from "@/hooks/use-program";
import { methodsOf } from "@/lib/solana/accounts";
import { findMarketAuthorityPda } from "@/lib/solana/pda";
import { formatDate, formatSol } from "@/lib/solana/format";
import { getMarketPhase } from "@/lib/solana/market";
import { CATEGORY_ICONS } from "@/lib/market-ui";
import { cn } from "@/lib/utils";
import type { MarketAccount, MarketPhase } from "@/lib/solana/types";

const RESOLVE_PRIORITY: Record<MarketPhase, number> = { ended: 0, live: 1, upcoming: 2, resolved: 3 };

export function ResolveMarketList() {
  const { markets, loading, error, refresh } = useMarkets();

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load markets"
        description={error}
        action={{ label: "Retry", onClick: refresh }}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!markets || markets.length === 0) {
    return (
      <EmptyState
        icon={Gavel}
        title="No markets yet"
        description="Create a market first, then come back here to resolve it once betting ends."
      />
    );
  }

  const sorted = [...markets].sort((a, b) => {
    const diff = RESOLVE_PRIORITY[getMarketPhase(a)] - RESOLVE_PRIORITY[getMarketPhase(b)];
    if (diff !== 0) return diff;
    return a.endTime.toNumber() - b.endTime.toNumber();
  });

  return (
    <div className="space-y-3">
      {sorted.map((market) => (
        <ResolveMarketRow
          key={market.publicKey.toBase58()}
          market={market}
          onResolved={refresh}
        />
      ))}
    </div>
  );
}

function ResolveMarketRow({
  market,
  onResolved,
}: {
  market: MarketAccount;
  onResolved: () => void;
}) {
  const { publicKey } = useWallet();
  const program = useProgram();
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const phase = getMarketPhase(market);
  const CategoryIcon = CATEGORY_ICONS[market.category];
  const canResolve = phase === "ended";

  async function handleResolve() {
    if (selected === null || !publicKey) return;
    setSubmitting(true);
    try {
      const [marketAuthority] = findMarketAuthorityPda();
      await methodsOf(program)
        .resolveMarket(selected)
        .accounts({
          admin: publicKey,
          marketAuthority,
          market: market.publicKey,
        })
        .rpc();

      toast.success("Market resolved", {
        description: `"${market.title}" → ${market.options[selected]}`,
      });
      onResolved();
    } catch (err) {
      toast.error("Resolve failed", {
        description: err instanceof Error ? err.message : "Transaction was not confirmed.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 pb-1">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <CategoryIcon className="h-3 w-3" aria-hidden="true" />
              {market.category}
            </Badge>
            <PhaseBadge phase={phase} />
            <span className="font-mono text-xs text-muted-foreground">
              #{market.marketId.toString()}
            </span>
          </div>
          <CardTitle className="text-base">{market.title}</CardTitle>
          <CardDescription className="font-mono text-xs">
            Ends {formatDate(market.endTime.toNumber())} · Pool {formatSol(market.totalPool)}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {market.resolved ? (
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2.5 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
            Resolved — <span className="font-medium text-success">{market.options[market.winningOption]}</span> won.
          </div>
        ) : !canResolve ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
            {phase === "upcoming"
              ? "Betting hasn't opened yet."
              : "Betting is still open — resolution unlocks once the end time passes."}
          </p>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {market.options.map((label, index) => {
                const active = selected === index;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelected(index)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-lg border px-3.5 py-2.5 text-left text-sm font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40 hover:bg-muted/60"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <Button
              disabled={selected === null || submitting}
              onClick={handleResolve}
              className="w-full sm:w-auto"
            >
              {submitting ? "Resolving…" : "Resolve Market"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
