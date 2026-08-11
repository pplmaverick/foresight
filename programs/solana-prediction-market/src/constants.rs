use anchor_lang::prelude::*;

#[constant]
pub const AUTHORITY_SEED: &[u8] = b"authority";

#[constant]
pub const MARKET_SEED: &[u8] = b"market";

#[constant]
pub const POSITION_SEED: &[u8] = b"position";

#[constant]
pub const VAULT_SEED: &[u8] = b"vault";

#[constant]
pub const MAX_OPTIONS: u8 = 4;

#[constant]
pub const MAX_TITLE_LEN: u16 = 100;

#[constant]
pub const MAX_DESCRIPTION_LEN: u16 = 500;

#[constant]
pub const MAX_OPTION_LEN: u16 = 50;

#[constant]
pub const MAX_BASIS_POINTS: u16 = 10_000;
