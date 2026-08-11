"use client";

import { useState } from "react";
import { BN } from "@coral-xyz/anchor";
import { SystemProgram } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { useProgram } from "@/hooks/use-program";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { accountsOf, methodsOf } from "@/lib/solana/accounts";
import { POSITION_ACCOUNT_SIZE } from "@/lib/solana/constants";
import { findPositionPda, findVaultPda } from "@/lib/solana/pda";
import { formatPct, solToLamports } from "@/lib/solana/format";
import { OPTION_COLORS } from "@/lib/market-ui";
import { cn } from "@/lib/utils";
import type { MarketAccount } from "@/lib/solana/types";

const QUICK_AMOUNTS_SOL = [0.1, 0.5, 1];

// Position layout: 8 (discriminator) + 32 (market) = offset of `user` field.
const MARKET_FIELD_OFFSET = 8;
const USER_FIELD_OFFSET = 8 + 32;

export function PlaceBetForm({
  market,
  onSuccess,
}: {
  market: MarketAccount;
  onSuccess: () => void;
}) {
  const { publicKey, connected } = useWallet();
  const program = useProgram();
  const { balanceSol, refresh: refreshBalance } = useWalletBalance();

  const [selected, setSelected] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const total = market.totalPool.toNumber();

  if (!connected || !publicKey) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-10 text-center">
        <p className="text-sm text-muted-foreground">Connect your wallet to place a bet.</p>
        <ConnectWalletButton />
      </div>
    );
  }

  const amountValue = Number(amount);
  const amountValid = amount.trim() !== "" && Number.isFinite(amountValue) && amountValue > 0;
  const sufficientFunds = balanceSol === null || amountValue <= balanceSol;
  const canSubmit = selected !== null && amountValid && sufficientFunds && !submitting;

  async function handleSubmit() {
    if (selected === null || !publicKey) return;
    setSubmitting(true);
    try {
      const existingPositions = await accountsOf(program).position.all([
        { dataSize: POSITION_ACCOUNT_SIZE },
        { memcmp: { offset: MARKET_FIELD_OFFSET, bytes: market.publicKey.toBase58() } },
        { memcmp: { offset: USER_FIELD_OFFSET, bytes: publicKey.toBase58() } },
      ]);
      const positionIndex = new BN(existingPositions.length);
      const [position] = findPositionPda(market.publicKey, publicKey, positionIndex);
      const [vault] = findVaultPda(market.publicKey);
      const lamports = new BN(solToLamports(amountValue));

      await methodsOf(program)
        .placeBet(selected, lamports, positionIndex)
        .accounts({
          user: publicKey,
          market: market.publicKey,
          position,
          vault,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success("Bet placed", {
        description: `${amount} SOL on "${market.options[selected]}"`,
      });
      setAmount("");
      setSelected(null);
      refreshBalance();
      onSuccess();
    } catch (err) {
      toast.error("Bet failed", {
        description: err instanceof Error ? err.message : "Transaction was not confirmed.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Choose an outcome</Label>
        <div className="grid gap-2">
          {market.options.map((label, index) => {
            const pool = market.optionPools[index]?.toNumber() ?? 0;
            const pct = total > 0 ? (pool / total) * 100 : 0;
            const active = selected === index;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setSelected(index)}
                aria-pressed={active}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors",
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40 hover:bg-muted/60"
                )}
              >
                <span className="flex items-center gap-2 font-medium">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: OPTION_COLORS[index % OPTION_COLORS.length] }}
                    aria-hidden="true"
                  />
                  {label}
                </span>
                <span className="font-mono text-xs text-muted-foreground">{formatPct(pct)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bet-amount">Amount</Label>
        <div className="relative">
          <Input
            id="bet-amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pr-14 font-mono"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            SOL
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex gap-1.5">
            {QUICK_AMOUNTS_SOL.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setAmount(String(q))}
                className="rounded-md border border-border px-2 py-1 font-mono transition-colors hover:bg-muted"
              >
                {q}
              </button>
            ))}
          </div>
          {balanceSol !== null && (
            <span className="font-mono tabular-nums">Balance: {balanceSol.toFixed(3)} SOL</span>
          )}
        </div>
        {!sufficientFunds && amountValid && (
          <p className="text-xs text-destructive">Amount exceeds your wallet balance.</p>
        )}
      </div>

      <Button className="w-full" size="lg" disabled={!canSubmit} onClick={handleSubmit}>
        {submitting ? "Placing bet…" : "Place Bet"}
      </Button>
    </div>
  );
}
