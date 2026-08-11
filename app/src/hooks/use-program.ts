"use client";

import { useMemo } from "react";
import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { IDL } from "@/lib/solana/idl";

/** Lets read-only queries (market list, positions) work before a wallet connects. */
const readOnlyWallet: anchor.Wallet = {
  publicKey: PublicKey.default,
  payer: Keypair.generate(),
  signTransaction: async () => {
    throw new Error("Connect a wallet to sign transactions.");
  },
  signAllTransactions: async () => {
    throw new Error("Connect a wallet to sign transactions.");
  },
};

export function useAnchorProvider(): anchor.AnchorProvider {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  return useMemo(
    () => new anchor.AnchorProvider(connection, wallet ?? readOnlyWallet, { commitment: "confirmed" }),
    [connection, wallet]
  );
}

export function useProgram(): anchor.Program {
  const provider = useAnchorProvider();
  return useMemo(() => new anchor.Program(IDL, provider), [provider]);
}
