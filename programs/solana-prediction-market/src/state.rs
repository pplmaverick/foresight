use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, InitSpace, Clone, Copy, PartialEq, Eq, Debug)]
pub enum Category {
    Weather,
    Sports,
    Crypto,
    Stock,
}

#[account]
#[derive(InitSpace)]
pub struct MarketAuthority {
    pub admin: Pubkey,
    /// Protocol fee, in basis points (1/100th of a percent), taken from winnings on claim.
    pub fee_rate: u16,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub market_id: u64,
    pub category: Category,
    #[max_len(100)]
    pub title: String,
    #[max_len(500)]
    pub description: String,
    #[max_len(4, 50)]
    pub options: Vec<String>,
    pub start_time: i64,
    pub end_time: i64,
    pub resolved: bool,
    pub winning_option: u8,
    pub total_pool: u64,
    /// Amount staked per option index, needed to compute each winner's proportional share.
    pub option_pools: [u64; 4],
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Position {
    pub market: Pubkey,
    pub user: Pubkey,
    pub position_index: u64,
    pub option_index: u8,
    pub amount: u64,
    pub claimed: bool,
    pub bump: u8,
}
