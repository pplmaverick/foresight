import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "8RcTb3UNNY5WzE5t4uFeoe3KndBiQhnjozMPxe9MtGGx"
);

export const CATEGORIES = ["Weather", "Sports", "Crypto", "Stock"] as const;
export type CategoryName = (typeof CATEGORIES)[number];

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 4;
export const MAX_TITLE_LEN = 100;
export const MAX_DESCRIPTION_LEN = 500;
export const MAX_OPTION_LEN = 50;

const AUTHORITY_SEED = "authority";
const MARKET_SEED = "market";
const POSITION_SEED = "position";
const VAULT_SEED = "vault";

export const SEEDS = {
  authority: AUTHORITY_SEED,
  market: MARKET_SEED,
  position: POSITION_SEED,
  vault: VAULT_SEED,
} as const;
