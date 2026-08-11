# Foresight

![Network](https://img.shields.io/badge/Solana-Devnet-9945FF)
![Rust](https://img.shields.io/badge/Rust-1.89-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-Next.js_14-3178C6)
![License](https://img.shields.io/badge/license-MIT-green)

Multi-category prediction market built natively for Solana — Weather, Sports, Crypto, and Stock markets, backed by a single Anchor program and PDA-derived accounts. Not a port from an EVM prediction-market template.

**Deployed on Solana Devnet** (Mainnet deployment planned — see [Roadmap](#roadmap))

| Field | Value |
|---|---|
| Network | Solana Devnet |
| Program | Foresight (`solana_prediction_market`) |
| Program ID | `8RcTb3UNNY5WzE5t4uFeoe3KndBiQhnjozMPxe9MtGGx` |
| Explorer | [View Program](https://explorer.solana.com/address/8RcTb3UNNY5WzE5t4uFeoe3KndBiQhnjozMPxe9MtGGx?cluster=devnet) |
| Frontend | [foresight-market.vercel.app](https://foresight-market.vercel.app) |

---

## Why Solana-Native

This isn't an EVM prediction-market contract ported over. Every design decision maps to something Solana does natively that a generic EVM approach can't.

| Problem | Generic EVM approach | Solana-native approach |
|---|---|---|
| Where does bet/position data live? | Packed into contract storage (`mapping(address => mapping(uint256 => Position))`), read/written through the contract itself | Each position is its own PDA account (`[position, market, user, position_index]`), rent-funded by the bettor, independently readable via `getProgramAccounts` — no contract storage bottleneck |
| Shipping a bug fix or schema change | Proxy pattern (UUPS/Transparent) — separate proxy + implementation contracts, storage-layout landmines on every upgrade | BPF Loader Upgradeable — the program keeps the **same Program ID** before and after an upgrade; no proxy indirection, no storage-slot bookkeeping |
| Supporting multiple wallets | Maintain a growing adapter/connector list per wallet (WalletConnect, injected connectors, etc.) | **Wallet Standard** — Backpack (and any other compliant wallet) auto-registers itself in the wallet modal; only Phantom needs an explicit adapter for broad compatibility |
| Resolving markets objectively | Chainlink-style price feed contract calls, gas overhead per read, separate oracle integration per chain | **Pyth pull oracle** (planned) — native Solana price feed accounts, sub-second updates, no bridging required |

---

## Architecture

```
┌───────────────────────────┐
│      Next.js Frontend      │
│  Tailwind + shadcn/ui      │
└─────────────┬───────────────┘
              │ @solana/web3.js + Anchor client
              ▼
┌───────────────────────────┐     Wallet Standard
│  Phantom / Backpack        │◀──── auto-detected,
│  (browser wallet)          │      no adapter list
└─────────────┬───────────────┘
              │ signed transaction
              ▼
┌─────────────────────────────────────────────────┐
│         Foresight Program (Anchor / Rust)        │
│         8RcTb...MtGGx                            │
│                                                   │
│  initialize → create_market → place_bet          │
│              → resolve_market → claim_reward      │
└─────────────────────┬─────────────────────────────┘
                       │ owns / derives via PDAs
     ┌─────────────────┼─────────────────┬───────────────────┐
     ▼                 ▼                 ▼                   ▼
MarketAuthority     Market PDA       Position PDA          Vault PDA
(admin, fee_rate)  (options, pools, (per bet — indexed by  (SOL escrow
                    resolution)      market+user+index)     per market)
```

---

## Core Features

### Multi-Category Markets
A single `Category` enum (`Weather`, `Sports`, `Crypto`, `Stock`) drives every market, so one program serves every vertical instead of forking a contract per category.

### Multi-Position Betting
A wallet is not limited to one bet per market. `Position` accounts are seeded with `[position, market, user, position_index]`, so a user can hold independent positions across different options (or repeated bets on the same option) in the same market — something that's natural on Solana's account model but requires real restructuring in an EVM `mapping`-based design.

### Proportional Payout with Protocol Fee
`claim_reward` computes each winner's share as `position.amount * total_pool / winning_pool`, minus a protocol fee (in basis points, admin-configurable at `initialize`). All arithmetic uses checked operations to guard against overflow.

### Admin Panel
A dedicated `/admin` route wraps `initialize`, `create_market`, and `resolve_market` in a UI, so the protocol authority doesn't need the CLI for day-to-day market operations.

---

## Deployed Program

**Solana Devnet**

| Program | Address |
|---|---|
| Foresight (`solana_prediction_market`) | `8RcTb3UNNY5WzE5t4uFeoe3KndBiQhnjozMPxe9MtGGx` |

All state — `MarketAuthority`, `Market`, `Position`, and the SOL vault — lives in PDAs derived from this single program; nothing else is separately deployed.

---

## Quick Start

**Prerequisites**
- Rust 1.89 (see `rust-toolchain.toml`) + Solana CLI (Agave) + Anchor CLI 1.1.2
- Node.js 18+
- A funded wallet on Solana Devnet (`solana airdrop 2 --url devnet`)

```bash
# 1. Install program dependencies (from repo root)
anchor build

# 2. Run the on-chain integration tests (litesvm — no local validator needed)
cargo test

# 3. Deploy to devnet
anchor deploy --provider.cluster devnet
```

```bash
# 4. Install frontend dependencies
cd app
npm install

# 5. Configure environment
cp .env.local.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_CLUSTER` | `devnet` (default), `testnet`, or `mainnet` / `mainnet-beta` |
| `NEXT_PUBLIC_RPC_ENDPOINT` | Optional RPC override — public cluster endpoints are rate-limited |

```bash
# 6. Run the frontend locally
npm run dev

# 7. Deploy the frontend
vercel --prod
```

---

## Program Interface

```rust
initialize(admin: Pubkey, fee_rate: u16)
create_market(market_id: u64, category: Category, title: String, description: String, options: Vec<String>, start_time: i64, end_time: i64)
place_bet(option_index: u8, amount: u64, position_index: u64)
resolve_market(winning_option: u8)
claim_reward(position_index: u64)
```

---

## Account Model & Position Indexing

Foresight stores no state in the program itself — every entity is a separate PDA:

| Account | Seeds | Holds |
|---|---|---|
| `MarketAuthority` | `["authority"]` | admin pubkey, protocol `fee_rate` (bps) |
| `Market` | `["market", market_id]` | category, options, pool totals, resolution state |
| `Position` | `["position", market, user, position_index]` | one bet: option, amount, claimed flag |
| Vault | `["vault", market]` | SOL escrow for a market, drained on claim |

`position_index` is client-computed by counting the caller's existing positions in a market and using the next integer — this is what allows repeated/multi-option betting per wallet per market instead of one PDA per `(market, user)` pair.

---

## Fees & Security

**Fees**
- Protocol fee is basis-points, set once at `initialize` (deployed with 500 bps / 5%), taken only from a winner's gross reward on `claim_reward`
- Winners split the *entire* pool (winning + losing stakes) proportional to their share of the winning option; losing positions have no payout path

**Security**
- `resolve_market` and the protocol `fee_rate` are gated to `market_authority.admin` via an `address` constraint
- Betting is time-boxed: `place_bet` requires `start_time <= now < end_time`; `resolve_market` requires `now >= end_time`
- All pool/reward math uses `checked_add` / `checked_mul` / `checked_div`, erroring out on overflow rather than wrapping
- `claim_reward` is gated by a `claimed` flag (no double-claim) and a `has_one = user` constraint (no claiming someone else's position)
- Full end-to-end flow (`initialize → create_market → place_bet → resolve_market → claim_reward`) is covered by an in-process `litesvm` integration test, run on every `anchor build`

---

## Implementation Notes

**Migrating Position's PDA seeds without breaking `claim_reward`**
Position PDAs originally used `[position, market, user]`, capping every wallet at one bet per market. Adding `position_index` to support multiple bets meant updating the seeds in *every* place that derives that PDA — not just `place_bet`, but `claim_reward` too, since its `seeds` constraint would silently fail to resolve the account (`ConstraintSeeds`) if left on the old 3-seed formula. Easy to miss since the compiler doesn't cross-check seed consistency between instructions.

**BPF Loader's minimum `ExtendProgram` chunk size**
After the account/program grew by ~624 bytes for the new `position_index: u64` field, `anchor deploy` to devnet failed three times with `ExtendProgram requires a minimum of 10240 additional bytes... but only 624 were requested`. Solana's upgradeable loader refuses to auto-extend a program's data account by less than 10,240 bytes per call. Fix: `solana program extend <program_id> 10240 --url devnet` once, manually, before redeploying.

**Anchor's camelCase IDL conversion only happens through `Program`**
Decoding accounts directly off the raw `idl.json` with `new BorshAccountsCoder(idlJson)` keeps every name snake_case (`option_index`, account name `"Position"`), so lookups by camelCase name fail. `new anchor.Program(idl, provider)` silently runs `convertIdlToCamelCase()` on construction — that's the only reason `program.account.position.all()` decodes into `positionIndex` / `optionIndex` for free in the app. Bypassing `Program` for a quick debug script (as we did while investigating the bug below) reproduces the mismatch instantly.

**A single stale account can crash an entire `getProgramAccounts` batch**
After the `position_index` migration, one pre-migration `Position` account (old, smaller layout) sitting alongside the new-format ones under the same `memcmp` filter made `program.account.position.all()` throw (`RangeError: offset out of range`) while decoding it with the new layout — killing the whole batch, not just that one account. The UI had no visible symptom beyond "No bets yet," because the catch block set an `error` state that the page never rendered. Fixed by adding a `dataSize` filter alongside the `memcmp` filter (so mismatched-layout accounts are excluded before decoding) and by actually surfacing the hook's `error` state in the UI.

---

## Stack

| Layer | Technology |
|---|---|
| Program | Rust 1.89 + Anchor 1.1.2 |
| Program tests | `litesvm` (in-process SVM) + `solana-transaction` / `solana-keypair` / `solana-clock` |
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Solana client | `@solana/web3.js` + `@coral-xyz/anchor` 0.32 |
| Wallets | Phantom (explicit adapter) + Backpack & others via Wallet Standard |
| Oracle | Pyth (planned, M3) |
| Hosting | Vercel |

---

## Roadmap

**✅ M1 — Core Prediction Market (completed)**
- `initialize`, `create_market`, `place_bet`, `resolve_market`, `claim_reward` implemented and exercised end-to-end on devnet

**✅ M2 — Multi-Position Support (completed)**
- `Position` PDA re-seeded with `market + user + position_index`, so a single wallet can hold multiple independent positions in the same market

**⬜ M3 — Pyth Oracle Auto-Resolution**
- Replace manual admin `resolve_market` calls with a Pyth pull-oracle price feed for objective, automatic settlement

**⬜ M4 — Mainnet + Colosseum Submission**
- Security review, Mainnet deployment, submission to the Colosseum hackathon

---

## Developer

GitHub: [pplmaverick](https://github.com/pplmaverick)
Wallet: `4MSa...PHuh`

## License

MIT
