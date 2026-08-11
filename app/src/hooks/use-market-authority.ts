"use client";

import { useEffect, useState } from "react";
import { useProgram } from "./use-program";
import { accountsOf } from "@/lib/solana/accounts";
import { findMarketAuthorityPda } from "@/lib/solana/pda";
import { mapMarketAuthority } from "@/lib/solana/mappers";
import type { MarketAuthorityAccount } from "@/lib/solana/types";

/** Global singleton account — fetched once and shared for fee-rate lookups. */
export function useMarketAuthority() {
  const program = useProgram();
  const [authority, setAuthority] = useState<MarketAuthorityAccount | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pda] = findMarketAuthorityPda();
        const raw = await accountsOf(program).marketAuthority.fetch(pda);
        if (!cancelled) setAuthority(mapMarketAuthority(pda, raw));
      } catch {
        if (!cancelled) setAuthority(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [program]);

  return authority;
}
