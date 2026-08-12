"use client";

import { useCallback, useEffect, useState } from "react";
import { useProgram } from "./use-program";
import { accountsOf } from "@/lib/solana/accounts";
import { findMarketAuthorityPda } from "@/lib/solana/pda";
import { mapMarketAuthority } from "@/lib/solana/mappers";
import type { MarketAuthorityAccount } from "@/lib/solana/types";

/** Global singleton account — fetched once and shared for fee-rate lookups. */
export function useMarketAuthority() {
  const program = useProgram();
  const [authority, setAuthority] = useState<MarketAuthorityAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [pda] = findMarketAuthorityPda();
      const raw = await accountsOf(program).marketAuthority.fetch(pda);
      setAuthority(mapMarketAuthority(pda, raw));
    } catch {
      setAuthority(null);
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { authority, loading, refresh };
}
