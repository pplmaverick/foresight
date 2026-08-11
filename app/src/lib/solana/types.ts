import type { PublicKey } from "@solana/web3.js";
import type { BN } from "@coral-xyz/anchor";
import type { CategoryName } from "./constants";

export interface MarketAccount {
  publicKey: PublicKey;
  marketId: BN;
  category: CategoryName;
  title: string;
  description: string;
  options: string[];
  startTime: BN;
  endTime: BN;
  resolved: boolean;
  winningOption: number;
  totalPool: BN;
  optionPools: BN[];
  bump: number;
}

export interface PositionAccount {
  publicKey: PublicKey;
  market: PublicKey;
  user: PublicKey;
  positionIndex: BN;
  optionIndex: number;
  amount: BN;
  claimed: boolean;
  bump: number;
}

export interface MarketAuthorityAccount {
  publicKey: PublicKey;
  admin: PublicKey;
  feeRate: number;
  bump: number;
}

export type MarketPhase = "upcoming" | "live" | "ended" | "resolved";
