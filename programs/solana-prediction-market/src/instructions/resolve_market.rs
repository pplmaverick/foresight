use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::ErrorCode,
    state::{Market, MarketAuthority},
};

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(address = market_authority.admin @ ErrorCode::Unauthorized)]
    pub admin: Signer<'info>,
    #[account(seeds = [AUTHORITY_SEED], bump = market_authority.bump)]
    pub market_authority: Account<'info, MarketAuthority>,
    #[account(
        mut,
        seeds = [MARKET_SEED, market.market_id.to_le_bytes().as_ref()],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,
}

pub fn handle_resolve_market(ctx: Context<ResolveMarket>, winning_option: u8) -> Result<()> {
    let market = &mut ctx.accounts.market;

    require!(!market.resolved, ErrorCode::MarketAlreadyResolved);
    require!(
        (winning_option as usize) < market.options.len(),
        ErrorCode::InvalidOptionIndex
    );

    let now = Clock::get()?.unix_timestamp;
    require!(now >= market.end_time, ErrorCode::MarketNotEnded);

    market.resolved = true;
    market.winning_option = winning_option;

    Ok(())
}
