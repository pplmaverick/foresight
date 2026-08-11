import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { PROGRAM_ID, SEEDS } from "./constants";

const seed = (s: string) => Buffer.from(s, "utf8");

export function findMarketAuthorityPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([seed(SEEDS.authority)], PROGRAM_ID);
}

export function findMarketPda(marketId: BN | number | string): [PublicKey, number] {
  const bn = BN.isBN(marketId) ? marketId : new BN(marketId);
  return PublicKey.findProgramAddressSync(
    [seed(SEEDS.market), bn.toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );
}

export function findPositionPda(market: PublicKey, user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [seed(SEEDS.position), market.toBuffer(), user.toBuffer()],
    PROGRAM_ID
  );
}

export function findVaultPda(market: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([seed(SEEDS.vault), market.toBuffer()], PROGRAM_ID);
}
