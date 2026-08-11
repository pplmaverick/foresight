"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "./use-program";
import { accountsOf } from "@/lib/solana/accounts";
import { POSITION_ACCOUNT_SIZE } from "@/lib/solana/constants";
import { mapPosition } from "@/lib/solana/mappers";
import type { PositionAccount } from "@/lib/solana/types";

// Position layout: 8 (discriminator) + 32 (market) = offset of `user` field.
const USER_FIELD_OFFSET = 8 + 32;

export function usePositions() {
  const program = useProgram();
  const { publicKey } = useWallet();
  const [positions, setPositions] = useState<PositionAccount[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!publicKey) {
      setPositions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const accounts = await accountsOf(program).position.all([
        { dataSize: POSITION_ACCOUNT_SIZE },
        { memcmp: { offset: USER_FIELD_OFFSET, bytes: publicKey.toBase58() } },
      ]);
      setPositions(
        accounts.map((a: { publicKey: PositionAccount["publicKey"]; account: unknown }) =>
          mapPosition(a.publicKey, a.account)
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load positions.");
    } finally {
      setLoading(false);
    }
  }, [program, publicKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { positions, loading, error, refresh };
}
