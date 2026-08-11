use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::ErrorCode,
    state::{Category, Market, MarketAuthority},
};

#[derive(Accounts)]
#[instruction(market_id: u64)]
pub struct CreateMarket<'info> {
    #[account(mut, address = market_authority.admin @ ErrorCode::Unauthorized)]
    pub admin: Signer<'info>,
    #[account(seeds = [AUTHORITY_SEED], bump = market_authority.bump)]
    pub market_authority: Account<'info, MarketAuthority>,
    #[account(
        init,
        payer = admin,
        space = 8 + Market::INIT_SPACE,
        seeds = [MARKET_SEED, market_id.to_le_bytes().as_ref()],
        bump
    )]
    pub market: Account<'info, Market>,
    pub system_program: Program<'info, System>,
}

pub fn handle_create_market(
    ctx: Context<CreateMarket>,
    market_id: u64,
    category: Category,
    title: String,
    description: String,
    options: Vec<String>,
    start_time: i64,
    end_time: i64,
) -> Result<()> {
    require!(
        title.len() <= MAX_TITLE_LEN as usize,
        ErrorCode::TitleTooLong
    );
    require!(
        description.len() <= MAX_DESCRIPTION_LEN as usize,
        ErrorCode::DescriptionTooLong
    );
    require!(
        options.len() >= 2 && options.len() <= MAX_OPTIONS as usize,
        ErrorCode::InvalidOptionCount
    );
    for option in options.iter() {
        require!(
            option.len() <= MAX_OPTION_LEN as usize,
            ErrorCode::OptionTooLong
        );
    }
    require!(end_time > start_time, ErrorCode::InvalidTimeRange);

    let market = &mut ctx.accounts.market;
    market.market_id = market_id;
    market.category = category;
    market.title = title;
    market.description = description;
    market.options = options;
    market.start_time = start_time;
    market.end_time = end_time;
    market.resolved = false;
    market.winning_option = 0;
    market.total_pool = 0;
    market.option_pools = [0; MAX_OPTIONS as usize];
    market.bump = ctx.bumps.market;

    Ok(())
}
