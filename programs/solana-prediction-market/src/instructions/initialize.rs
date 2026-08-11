use anchor_lang::prelude::*;

use crate::{constants::*, error::ErrorCode, state::MarketAuthority};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + MarketAuthority::INIT_SPACE,
        seeds = [AUTHORITY_SEED],
        bump
    )]
    pub market_authority: Account<'info, MarketAuthority>,
    pub system_program: Program<'info, System>,
}

pub fn handle_initialize(ctx: Context<Initialize>, admin: Pubkey, fee_rate: u16) -> Result<()> {
    require!(fee_rate <= MAX_BASIS_POINTS, ErrorCode::InvalidFeeRate);

    let market_authority = &mut ctx.accounts.market_authority;
    market_authority.admin = admin;
    market_authority.fee_rate = fee_rate;
    market_authority.bump = ctx.bumps.market_authority;

    Ok(())
}
