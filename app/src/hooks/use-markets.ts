"use client";

import { useCallback, useEffect, useState } from "react";
import { useProgram } from "./use-program";
import { accountsOf } from "@/lib/solana/accounts";
import { mapMarket } from "@/lib/solana/mappers";
import type { MarketAccount } from "@/lib/solana/types";

export function useMarkets() {
  const program = useProgram();
  const [markets, setMarkets] = useState<MarketAccount[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const accounts = await accountsOf(program).market.all();
      setMarkets(
        accounts.map((a: { publicKey: MarketAccount["publicKey"]; account: unknown }) =>
          mapMarket(a.publicKey, a.account)
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load markets.");
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { markets, loading, error, refresh };
}
