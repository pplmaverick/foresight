import type { Idl } from "@coral-xyz/anchor";
import idlJson from "./idl.json";

// TypeScript widens JSON-imported string fields (e.g. seed "kind") to `string`,
// so this doesn't structurally satisfy Anchor's literal-union `Idl` type without
// a generated `target/types/*.ts` file. Accessed with a targeted `any` cast at
// each `program.account.*` call site instead of fighting that at the type level.
export const IDL = idlJson as unknown as Idl;
