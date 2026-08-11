use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::ErrorCode,
    state::{Market, MarketAuthority, Position},
};

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(seeds = [AUTHORITY_SEED], bump = market_authority.bump)]
    pub market_authority: Account<'info, MarketAuthority>,
    #[account(
        seeds = [MARKET_SEED, market.market_id.to_le_bytes().as_ref()],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,
    #[account(
        mut,
        seeds = [POSITION_SEED, market.key().as_ref(), user.key().as_ref()],
        bump = position.bump,
        has_one = user,
    )]
    pub position: Account<'info, Position>,
    #[account(
        mut,
        seeds = [VAULT_SEED, market.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,
    /// CHECK: only receives the protocol fee, verified against market_authority.admin.
    #[account(mut, address = market_authority.admin @ ErrorCode::Unauthorized)]
    pub admin: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handle_claim_reward(ctx: Context<ClaimReward>) -> Result<()> {
    let market = &ctx.accounts.market;
    let position = &ctx.accounts.position;
    let fee_rate = ctx.accounts.market_authority.fee_rate;

    require!(market.resolved, ErrorCode::MarketNotResolved);
    require!(!position.claimed, ErrorCode::AlreadyClaimed);
    require!(
        position.option_index == market.winning_option,
        ErrorCode::NotWinningPosition
    );

    let winning_pool = market.option_pools[market.winning_option as usize];
    require!(winning_pool > 0, ErrorCode::NoWinningPool);

    let gross_reward = (position.amount as u128)
        .checked_mul(market.total_pool as u128)
        .ok_or(ErrorCode::MathOverflow)?
        .checked_div(winning_pool as u128)
        .ok_or(ErrorCode::MathOverflow)? as u64;

    let fee = (gross_reward as u128)
        .checked_mul(fee_rate as u128)
        .ok_or(ErrorCode::MathOverflow)?
        .checked_div(MAX_BASIS_POINTS as u128)
        .ok_or(ErrorCode::MathOverflow)? as u64;

    let net_reward = gross_reward.checked_sub(fee).ok_or(ErrorCode::MathOverflow)?;

    let market_key = market.key();
    let vault_bump = ctx.bumps.vault;
    let vault_seeds: &[&[u8]] = &[VAULT_SEED, market_key.as_ref(), &[vault_bump]];
    let signer_seeds: &[&[&[u8]]] = &[vault_seeds];

    if net_reward > 0 {
        let cpi_accounts = anchor_lang::system_program::Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            anchor_lang::system_program::ID,
            cpi_accounts,
            signer_seeds,
        );
        anchor_lang::system_program::transfer(cpi_ctx, net_reward)?;
    }

    if fee > 0 {
        let cpi_accounts = anchor_lang::system_program::Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.admin.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            anchor_lang::system_program::ID,
            cpi_accounts,
            signer_seeds,
        );
        anchor_lang::system_program::transfer(cpi_ctx, fee)?;
    }

    let position = &mut ctx.accounts.position;
    position.claimed = true;

    Ok(())
}
