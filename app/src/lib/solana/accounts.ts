import type { Program } from "@coral-xyz/anchor";

/**
 * The IDL is loaded from raw JSON without Anchor's generated `target/types` file,
 * so `Program` has no compile-time knowledge of account/method names. These are
 * the only two places that punch through to the runtime API with `any` — every
 * caller immediately maps the result into the typed shapes from `types.ts`.
 */
export function accountsOf(program: Program) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return program.account as any;
}

export function methodsOf(program: Program) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return program.methods as any;
}
