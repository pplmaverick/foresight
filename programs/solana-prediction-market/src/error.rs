use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Only the admin can perform this action")]
    Unauthorized,
    #[msg("Fee rate cannot exceed 100%")]
    InvalidFeeRate,
    #[msg("Market must have between 2 and 4 options")]
    InvalidOptionCount,
    #[msg("Title exceeds maximum length")]
    TitleTooLong,
    #[msg("Description exceeds maximum length")]
    DescriptionTooLong,
    #[msg("Option label exceeds maximum length")]
    OptionTooLong,
    #[msg("End time must be after start time")]
    InvalidTimeRange,
    #[msg("Invalid option index")]
    InvalidOptionIndex,
    #[msg("Bet amount must be greater than zero")]
    InvalidAmount,
    #[msg("Market is already resolved")]
    MarketAlreadyResolved,
    #[msg("Market betting window has not opened yet")]
    MarketNotStarted,
    #[msg("Market betting window is closed")]
    MarketClosed,
    #[msg("Market betting period has not ended yet")]
    MarketNotEnded,
    #[msg("Market has not been resolved yet")]
    MarketNotResolved,
    #[msg("Reward has already been claimed")]
    AlreadyClaimed,
    #[msg("This position did not bet on the winning option")]
    NotWinningPosition,
    #[msg("No bets were placed on the winning option")]
    NoWinningPool,
    #[msg("Math overflow")]
    MathOverflow,
}
