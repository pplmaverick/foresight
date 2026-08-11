use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::ErrorCode,
    state::{Market, Position},
};

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [MARKET_SEED, market.market_id.to_le_bytes().as_ref()],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,
    #[account(
        init,
        payer = user,
        space = 8 + Position::INIT_SPACE,
        seeds = [POSITION_SEED, market.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub position: Account<'info, Position>,
    #[account(
        mut,
        seeds = [VAULT_SEED, market.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handle_place_bet(ctx: Context<PlaceBet>, option_index: u8, amount: u64) -> Result<()> {
    let market = &ctx.accounts.market;

    require!(!market.resolved, ErrorCode::MarketAlreadyResolved);
    require!(
        (option_index as usize) < market.options.len(),
        ErrorCode::InvalidOptionIndex
    );
    require!(amount > 0, ErrorCode::InvalidAmount);

    let now = Clock::get()?.unix_timestamp;
    require!(now >= market.start_time, ErrorCode::MarketNotStarted);
    require!(now < market.end_time, ErrorCode::MarketClosed);

    let market_key = market.key();

    let cpi_accounts = anchor_lang::system_program::Transfer {
        from: ctx.accounts.user.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(anchor_lang::system_program::ID, cpi_accounts);
    anchor_lang::system_program::transfer(cpi_ctx, amount)?;

    let market = &mut ctx.accounts.market;
    market.total_pool = market
        .total_pool
        .checked_add(amount)
        .ok_or(ErrorCode::MathOverflow)?;
    market.option_pools[option_index as usize] = market.option_pools[option_index as usize]
        .checked_add(amount)
        .ok_or(ErrorCode::MathOverflow)?;

    let position = &mut ctx.accounts.position;
    position.market = market_key;
    position.user = ctx.accounts.user.key();
    position.option_index = option_index;
    position.amount = amount;
    position.claimed = false;
    position.bump = ctx.bumps.position;

    Ok(())
}
