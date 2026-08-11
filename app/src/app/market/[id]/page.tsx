"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { StatTile } from "@/components/stat-tile";
import { PhaseBadge } from "@/components/markets/phase-badge";
import { CountdownLabel } from "@/components/markets/countdown-label";
import { BetDistributionChart } from "@/components/markets/bet-distribution-chart";
import { PlaceBetForm } from "@/components/markets/place-bet-form";
import { useMarket } from "@/hooks/use-market";
import { getMarketPhase } from "@/lib/solana/market";
import { formatDate, formatSol } from "@/lib/solana/format";
import { CATEGORY_ICONS } from "@/lib/market-ui";

export default function MarketDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { market, loading, error, refresh } = useMarket(params.id);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <EmptyState
          icon={AlertTriangle}
          title="Market not found"
          description={error}
          action={{ label: "Back to markets", onClick: () => router.push("/") }}
        />
      </div>
    );
  }

  if (loading || !market) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-9 w-2/3" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const phase = getMarketPhase(market);
  const CategoryIcon = CATEGORY_ICONS[market.category];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All markets
      </Link>

      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <CategoryIcon className="h-3 w-3" aria-hidden="true" />
            {market.category}
          </Badge>
          <PhaseBadge phase={phase} />
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {market.title}
        </h1>
        {market.description && (
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            {market.description}
          </p>
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total pool" value={formatSol(market.totalPool)} />
        <StatTile label="Outcomes" value={String(market.options.length)} />
        <StatTile
          label={phase === "upcoming" ? "Starts" : "Ends"}
          value={formatDate(
            phase === "upcoming" ? market.startTime.toNumber() : market.endTime.toNumber()
          )}
        />
        <StatTile
          label="Status"
          value={
            market.resolved
              ? market.options[market.winningOption]
              : phase === "live"
                ? "Betting open"
                : phase === "upcoming"
                  ? "Not started"
                  : "Betting closed"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Outcome distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <BetDistributionChart market={market} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Place a bet</CardTitle>
          </CardHeader>
          <CardContent>
            {phase === "live" ? (
              <PlaceBetForm market={market} onSuccess={refresh} />
            ) : phase === "upcoming" ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                <span>Betting hasn&apos;t opened yet.</span>
                <CountdownLabel targetUnixSeconds={market.startTime.toNumber()} prefix="Opens in" />
              </div>
            ) : market.resolved ? (
              <div className="rounded-lg border border-success/30 bg-success/5 py-10 text-center text-sm">
                Market resolved —{" "}
                <span className="font-medium text-success">
                  {market.options[market.winningOption]}
                </span>{" "}
                won.
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                Betting is closed. Awaiting resolution.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
