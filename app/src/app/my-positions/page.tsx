"use client";

import { useMemo } from "react";
import { Wallet } from "lucide-react";
import { BN } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { EmptyState } from "@/components/empty-state";
import { StatTile } from "@/components/stat-tile";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { PositionCard } from "@/components/positions/position-card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePositions } from "@/hooks/use-positions";
import { useMarkets } from "@/hooks/use-markets";
import { useMarketAuthority } from "@/hooks/use-market-authority";
import { estimateNetReward, getPositionStatus } from "@/lib/solana/market";
import { formatSol } from "@/lib/solana/format";
import type { MarketAccount } from "@/lib/solana/types";

const STATUS_RANK = { claimable: 0, pending: 1, claimed: 2, lost: 3 } as const;

export default function MyPositionsPage() {
  const { connected } = useWallet();
  const { positions, loading: positionsLoading, refresh: refreshPositions } = usePositions();
  const { markets, loading: marketsLoading } = useMarkets();
  const authority = useMarketAuthority();

  const marketsByAddress = useMemo(() => {
    const map = new Map<string, MarketAccount>();
    markets?.forEach((m) => map.set(m.publicKey.toBase58(), m));
    return map;
  }, [markets]);

  const sortedPositions = useMemo(() => {
    if (!positions) return [];
    return [...positions].sort((a, b) => {
      const marketA = marketsByAddress.get(a.market.toBase58());
      const marketB = marketsByAddress.get(b.market.toBase58());
      return STATUS_RANK[getPositionStatus(a, marketA)] - STATUS_RANK[getPositionStatus(b, marketB)];
    });
  }, [positions, marketsByAddress]);

  const totals = useMemo(() => {
    return (positions ?? []).reduce(
      (acc, position) => {
        const market = marketsByAddress.get(position.market.toBase58());
        acc.staked = acc.staked.add(position.amount);
        if (market && getPositionStatus(position, market) === "claimable" && authority) {
          acc.claimable = acc.claimable.add(estimateNetReward(position.amount, market, authority.feeRate));
        }
        return acc;
      },
      { staked: new BN(0), claimable: new BN(0) }
    );
  }, [positions, marketsByAddress, authority]);

  if (!connected) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Wallet className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="font-heading text-base font-medium">Connect your wallet</p>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              Connect a wallet to see your bets and claimable rewards.
            </p>
          </div>
          <ConnectWalletButton />
        </div>
      </div>
    );
  }

  const loading = positionsLoading || marketsLoading;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 space-y-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          My Positions
        </h1>
        <p className="text-sm text-muted-foreground">
          Track your bets and claim rewards from resolved markets.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Open positions" value={String(positions?.length ?? 0)} />
        <StatTile label="Total staked" value={formatSol(totals.staked)} />
        <StatTile label="Claimable now" value={formatSol(totals.claimable)} />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : sortedPositions.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No bets yet"
          description="Place a bet on any market to see it appear here."
        />
      ) : (
        <div className="space-y-3">
          {sortedPositions.map((position) => (
            <PositionCard
              key={position.publicKey.toBase58()}
              position={position}
              market={marketsByAddress.get(position.market.toBase58())}
              authority={authority}
              onClaimed={refreshPositions}
            />
          ))}
        </div>
      )}
    </div>
  );
}
