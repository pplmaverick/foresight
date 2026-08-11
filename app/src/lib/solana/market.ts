import { BN } from "@coral-xyz/anchor";
import type { MarketAccount, MarketPhase, PositionAccount } from "./types";

export function getMarketPhase(market: MarketAccount, nowSeconds = Date.now() / 1000): MarketPhase {
  if (market.resolved) return "resolved";
  const start = market.startTime.toNumber();
  const end = market.endTime.toNumber();
  if (nowSeconds < start) return "upcoming";
  if (nowSeconds < end) return "live";
  return "ended";
}

export function optionSharePct(market: MarketAccount, optionIndex: number): number {
  const total = market.totalPool.toNumber();
  if (total <= 0) return 0;
  const pool = market.optionPools[optionIndex]?.toNumber() ?? 0;
  return (pool / total) * 100;
}

const MAX_BASIS_POINTS = 10_000;

/** Mirrors the on-chain payout math in `claim_reward`: proportional share of the pool, minus protocol fee. */
export function estimateNetReward(
  positionAmount: BN,
  market: MarketAccount,
  feeRateBps: number
): BN {
  const winningPool = market.optionPools[market.winningOption];
  if (!winningPool || winningPool.isZero()) return new BN(0);

  const gross = positionAmount.mul(market.totalPool).div(winningPool);
  const fee = gross.mul(new BN(feeRateBps)).div(new BN(MAX_BASIS_POINTS));
  return gross.sub(fee);
}

export type PositionStatus = "pending" | "claimable" | "claimed" | "lost";

export function getPositionStatus(
  position: PositionAccount,
  market: MarketAccount | undefined
): PositionStatus {
  if (!market || !market.resolved) return "pending";
  if (position.optionIndex !== market.winningOption) return "lost";
  return position.claimed ? "claimed" : "claimable";
}
