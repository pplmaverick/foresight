"use client";

import Link from "next/link";
import { useState } from "react";
import { SystemProgram } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProgram } from "@/hooks/use-program";
import { methodsOf } from "@/lib/solana/accounts";
import { findMarketAuthorityPda, findVaultPda } from "@/lib/solana/pda";
import { formatSol } from "@/lib/solana/format";
import { estimateNetReward, getPositionStatus, type PositionStatus } from "@/lib/solana/market";
import { cn } from "@/lib/utils";
import type { MarketAccount, MarketAuthorityAccount, PositionAccount } from "@/lib/solana/types";

const STATUS_META: Record<
  PositionStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  pending: { label: "Pending", icon: Circle, className: "border-secondary/40 text-secondary-foreground" },
  claimable: { label: "Claimable", icon: CheckCircle2, className: "border-success/40 bg-success/10 text-success" },
  claimed: { label: "Claimed", icon: CheckCircle2, className: "border-accent/40 bg-accent/10 text-accent" },
  lost: { label: "Not a winner", icon: XCircle, className: "border-border text-muted-foreground" },
};

export function PositionCard({
  position,
  market,
  authority,
  onClaimed,
}: {
  position: PositionAccount;
  market: MarketAccount | undefined;
  authority: MarketAuthorityAccount | null;
  onClaimed: () => void;
}) {
  const program = useProgram();
  const { publicKey } = useWallet();
  const [claiming, setClaiming] = useState(false);

  if (!market) return null;

  const status = getPositionStatus(position, market);
  const meta = STATUS_META[status];
  const netReward =
    status === "claimable" && authority ? estimateNetReward(position.amount, market, authority.feeRate) : null;

  async function handleClaim() {
    if (!publicKey || !market || !authority) return;
    setClaiming(true);
    try {
      const [marketAuthority] = findMarketAuthorityPda();
      const [vault] = findVaultPda(market.publicKey);

      await methodsOf(program)
        .claimReward(position.positionIndex)
        .accounts({
          user: publicKey,
          marketAuthority,
          market: market.publicKey,
          position: position.publicKey,
          vault,
          admin: authority.admin,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success("Reward claimed", {
        description: netReward ? `${formatSol(netReward)} sent to your wallet.` : undefined,
      });
      onClaimed();
    } catch (err) {
      toast.error("Claim failed", {
        description: err instanceof Error ? err.message : "Transaction was not confirmed.",
      });
    } finally {
      setClaiming(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <Link
            href={`/market/${market.publicKey.toBase58()}`}
            className="line-clamp-1 font-heading text-sm font-medium hover:underline"
          >
            {market.title}
          </Link>
          <p className="text-xs text-muted-foreground">
            Bet on{" "}
            <span className="font-medium text-foreground">
              {market.options[position.optionIndex]}
            </span>{" "}
            · <span className="font-mono tabular-nums">{formatSol(position.amount)}</span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Badge variant="outline" className={cn("gap-1.5", meta.className)}>
            <meta.icon className="h-3 w-3" aria-hidden="true" />
            {meta.label}
          </Badge>
          {status === "claimable" && (
            <Button size="sm" onClick={handleClaim} disabled={claiming || !authority}>
              {claiming ? "Claiming…" : netReward ? `Claim ${formatSol(netReward)}` : "Claim"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
