import { clusterApiUrl } from "@solana/web3.js";

export type ClusterName = "devnet" | "testnet" | "mainnet-beta";

export function getCluster(): ClusterName {
  const raw = (process.env.NEXT_PUBLIC_CLUSTER ?? "mainnet-beta").toLowerCase().trim();
  if (raw === "mainnet" || raw === "mainnet-beta") return "mainnet-beta";
  if (raw === "testnet") return "testnet";
  if (raw === "devnet") return "devnet";
  return "mainnet-beta";
}

export function getClusterLabel(cluster: ClusterName = getCluster()): string {
  if (cluster === "mainnet-beta") return "Mainnet";
  if (cluster === "testnet") return "Testnet";
  return "Devnet";
}

/** Public cluster RPCs are rate-limited; set NEXT_PUBLIC_RPC_ENDPOINT for production use. */
export function getRpcEndpoint(): string {
  const override = process.env.NEXT_PUBLIC_RPC_ENDPOINT;
  if (override) return override;
  return clusterApiUrl(getCluster());
}
