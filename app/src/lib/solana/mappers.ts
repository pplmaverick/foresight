import type { PublicKey } from "@solana/web3.js";
import { CATEGORIES, type CategoryName } from "./constants";
import type { MarketAccount, MarketAuthorityAccount, PositionAccount } from "./types";

/** Anchor decodes Rust unit enums as `{ variantName: {} }`; extract and title-case the key. */
export function parseCategory(raw: Record<string, unknown>): CategoryName {
  const key = Object.keys(raw)[0] ?? "";
  const match = CATEGORIES.find((c) => c.toLowerCase() === key.toLowerCase());
  return match ?? "Crypto";
}

/** Inverse of parseCategory — Anchor's Borsh coder expects the variant name lowercased. */
export function toCategoryArg(category: CategoryName): Record<string, Record<string, never>> {
  return { [category.toLowerCase()]: {} };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapMarket(publicKey: PublicKey, raw: any): MarketAccount {
  return {
    publicKey,
    marketId: raw.marketId,
    category: parseCategory(raw.category),
    title: raw.title,
    description: raw.description,
    options: raw.options,
    startTime: raw.startTime,
    endTime: raw.endTime,
    resolved: raw.resolved,
    winningOption: raw.winningOption,
    totalPool: raw.totalPool,
    optionPools: raw.optionPools,
    bump: raw.bump,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPosition(publicKey: PublicKey, raw: any): PositionAccount {
  return {
    publicKey,
    market: raw.market,
    user: raw.user,
    positionIndex: raw.positionIndex,
    optionIndex: raw.optionIndex,
    amount: raw.amount,
    claimed: raw.claimed,
    bump: raw.bump,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapMarketAuthority(publicKey: PublicKey, raw: any): MarketAuthorityAccount {
  return {
    publicKey,
    admin: raw.admin,
    feeRate: raw.feeRate,
    bump: raw.bump,
  };
}
