import Link from "next/link";
import { Layers, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhaseBadge } from "@/components/markets/phase-badge";
import { CountdownLabel } from "@/components/markets/countdown-label";
import { getMarketPhase } from "@/lib/solana/market";
import { formatSol } from "@/lib/solana/format";
import { CATEGORY_ICONS } from "@/lib/market-ui";
import type { MarketAccount } from "@/lib/solana/types";

export function MarketCard({ market }: { market: MarketAccount }) {
  const phase = getMarketPhase(market);
  const CategoryIcon = CATEGORY_ICONS[market.category];
  const countdown =
    phase === "upcoming" ? (
      <CountdownLabel targetUnixSeconds={market.startTime.toNumber()} prefix="Starts in" />
    ) : phase === "live" ? (
      <CountdownLabel targetUnixSeconds={market.endTime.toNumber()} prefix="Ends in" />
    ) : (
      <span className="inline-flex items-center gap-1.5 font-mono text-sm text-muted-foreground">
        Closed
      </span>
    );

  return (
    <Link
      href={`/market/${market.publicKey.toBase58()}`}
      className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:ring-primary/40">
        <CardHeader className="flex-row items-start justify-between gap-2 pb-1">
          <Badge variant="secondary" className="gap-1.5">
            <CategoryIcon className="h-3 w-3" aria-hidden="true" />
            {market.category}
          </Badge>
          <PhaseBadge phase={phase} />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CardTitle className="line-clamp-2 text-base leading-snug">{market.title}</CardTitle>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            {market.options.length} outcomes
          </div>

          <div className="flex items-center justify-between border-t border-border/60 pt-3">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span className="font-mono text-sm font-medium tabular-nums">
                {formatSol(market.totalPool)}
              </span>
            </div>
            {countdown}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
