"use client";

import { useState } from "react";
import { SystemProgram } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatTile } from "@/components/stat-tile";
import { useProgram } from "@/hooks/use-program";
import { methodsOf } from "@/lib/solana/accounts";
import { findMarketAuthorityPda } from "@/lib/solana/pda";
import { formatPct, truncateAddress } from "@/lib/solana/format";
import type { MarketAuthorityAccount } from "@/lib/solana/types";

const DEFAULT_FEE_BPS = 500;
const MAX_BASIS_POINTS = 10_000;

export function AuthorityPanel({
  authority,
  loading,
  onInitialized,
}: {
  authority: MarketAuthorityAccount | null;
  loading: boolean;
  onInitialized: () => void;
}) {
  const { publicKey } = useWallet();
  const program = useProgram();
  const [feeBps, setFeeBps] = useState(String(DEFAULT_FEE_BPS));
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (authority) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
            Market Authority
          </CardTitle>
          <CardDescription>Program-wide admin and fee configuration.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile label="Admin" value={truncateAddress(authority.admin.toBase58(), 6)} />
          <StatTile label="Fee rate" value={formatPct(authority.feeRate / 100)} />
          <StatTile label="Authority PDA" value={truncateAddress(authority.publicKey.toBase58(), 6)} />
        </CardContent>
      </Card>
    );
  }

  const feeValue = Number(feeBps);
  const feeValid =
    feeBps.trim() !== "" &&
    Number.isInteger(feeValue) &&
    feeValue >= 0 &&
    feeValue <= MAX_BASIS_POINTS;
  const canSubmit = !!publicKey && feeValid && !submitting;

  async function handleInitialize() {
    if (!publicKey) return;
    setSubmitting(true);
    try {
      const [marketAuthority] = findMarketAuthorityPda();
      await methodsOf(program)
        .initialize(publicKey, feeValue)
        .accounts({
          payer: publicKey,
          marketAuthority,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success("Market authority initialized", {
        description: `Admin set to ${truncateAddress(publicKey.toBase58())} at ${formatPct(feeValue / 100)} fee.`,
      });
      onInitialized();
    } catch (err) {
      toast.error("Initialize failed", {
        description: err instanceof Error ? err.message : "Transaction was not confirmed.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Initialize Market Authority</CardTitle>
        <CardDescription>
          This program has no MarketAuthority account yet. The wallet that initializes it becomes
          the permanent admin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Admin (connected wallet)</Label>
          <Input
            readOnly
            value={publicKey ? publicKey.toBase58() : "Connect a wallet"}
            className="font-mono text-xs"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fee-rate">Fee rate (basis points)</Label>
          <Input
            id="fee-rate"
            type="number"
            inputMode="numeric"
            min="0"
            max={MAX_BASIS_POINTS}
            step="1"
            value={feeBps}
            onChange={(e) => setFeeBps(e.target.value)}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            {feeValid
              ? `= ${formatPct(feeValue / 100)}, taken from winnings on claim.`
              : `Enter a whole number between 0 and ${MAX_BASIS_POINTS}.`}
          </p>
        </div>
        <Button className="w-full" disabled={!canSubmit} onClick={handleInitialize}>
          {submitting ? "Initializing…" : "Initialize Market Authority"}
        </Button>
      </CardContent>
    </Card>
  );
}
