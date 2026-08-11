import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import type { BN } from "@coral-xyz/anchor";

function toNumber(lamports: BN | number): number {
  return typeof lamports === "number" ? lamports : lamports.toNumber();
}

export function lamportsToSol(lamports: BN | number): number {
  return toNumber(lamports) / LAMPORTS_PER_SOL;
}

export function solToLamports(sol: number): number {
  return Math.round(sol * LAMPORTS_PER_SOL);
}

const solFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

export function formatSol(lamports: BN | number): string {
  return `${solFormatter.format(lamportsToSol(lamports))} SOL`;
}

const pctFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

export function formatPct(value: number): string {
  return `${pctFormatter.format(value)}%`;
}

export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

/** Compact duration for countdowns, e.g. "2d 4h", "12m 03s". */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  if (seconds === 0) return "0s";

  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const secs = seconds % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${String(secs).padStart(2, "0")}s`;
  return `${secs}s`;
}

export function formatDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
