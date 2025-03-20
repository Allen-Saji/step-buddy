use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Challenge is not active")]
    ChallengeNotActive,
    
    #[msg("Challenge is already completed")]
    ChallengeCompleted,
    
    #[msg("Challenge is full")]
    ChallengeFull,
    
    #[msg("Challenge has ended")]
    ChallengeEnded,
    
    #[msg("Invalid verification day")]
    InvalidVerificationDay,
    
    #[msg("Unauthorized action")]
    Unauthorized,
    
    #[msg("Challenge is already processed")]
    ChallengeAlreadyCompleted,
    
    #[msg("Challenge is not completed yet")]
    ChallengeNotCompleted,
    
    #[msg("Rewards already withdrawn")]
    AlreadyWithdrawn,
    
    #[msg("Challenge has not ended yet")]
    ChallengeNotEnded,
}