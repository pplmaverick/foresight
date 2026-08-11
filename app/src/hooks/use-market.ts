"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "./use-program";
import { accountsOf } from "@/lib/solana/accounts";
import { mapMarket } from "@/lib/solana/mappers";
import type { MarketAccount } from "@/lib/solana/types";

const POLL_INTERVAL_MS = 15_000;

export function useMarket(address: string | undefined) {
  const program = useProgram();
  const [market, setMarket] = useState<MarketAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address) return;
    try {
      const pubkey = new PublicKey(address);
      const raw = await accountsOf(program).market.fetch(pubkey);
      setMarket(mapMarket(pubkey, raw));
      setError(null);
    } catch {
      setError("Market not found.");
    } finally {
      setLoading(false);
    }
  }, [program, address]);

  useEffect(() => {
    setLoading(true);
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return { market, loading, error, refresh };
}
