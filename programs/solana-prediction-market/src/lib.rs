pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("8RcTb3UNNY5WzE5t4uFeoe3KndBiQhnjozMPxe9MtGGx");

#[program]
pub mod solana_prediction_market {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, admin: Pubkey, fee_rate: u16) -> Result<()> {
        crate::instructions::initialize::handle_initialize(ctx, admin, fee_rate)
    }

    pub fn create_market(
        ctx: Context<CreateMarket>,
        market_id: u64,
        category: Category,
        title: String,
        description: String,
        options: Vec<String>,
        start_time: i64,
        end_time: i64,
    ) -> Result<()> {
        crate::instructions::create_market::handle_create_market(
            ctx,
            market_id,
            category,
            title,
            description,
            options,
            start_time,
            end_time,
        )
    }

    pub fn place_bet(
        ctx: Context<PlaceBet>,
        option_index: u8,
        amount: u64,
        position_index: u64,
    ) -> Result<()> {
        crate::instructions::place_bet::handle_place_bet(ctx, option_index, amount, position_index)
    }

    pub fn resolve_market(ctx: Context<ResolveMarket>, winning_option: u8) -> Result<()> {
        crate::instructions::resolve_market::handle_resolve_market(ctx, winning_option)
    }

    pub fn claim_reward(ctx: Context<ClaimReward>, position_index: u64) -> Result<()> {
        crate::instructions::claim_reward::handle_claim_reward(ctx, position_index)
    }
}
