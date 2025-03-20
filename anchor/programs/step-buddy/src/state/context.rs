// programs/step-buddy/src/state/context.rs
use anchor_lang::prelude::*;
use super::{Challenge, Participant};

#[derive(Accounts)]
#[instruction(challenge_id: u64)]
pub struct InitializeChallenge<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + Challenge::SIZE,
        seeds = [b"challenge".as_ref(), &challenge_id.to_le_bytes()],
        bump
    )]
    pub challenge: Account<'info, Challenge>,
    
    #[account(
        seeds = [b"vault".as_ref(), &challenge_id.to_le_bytes()],
        bump,
    )]
    /// CHECK: This is the vault PDA that will hold the funds
    pub vault: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(challenge_id: u64)]
pub struct JoinChallenge<'info> {
    #[account(
        seeds = [b"challenge".as_ref(), &challenge_id.to_le_bytes()],
        bump = challenge.bump,
    )]
    pub challenge: Account<'info, Challenge>,
    
    #[account(
        init,
        payer = user,
        space = 8 + Participant::SIZE,
        seeds = [
            b"participant".as_ref(),
            user.key().as_ref(),
            &challenge_id.to_le_bytes()
        ],
        bump
    )]
    pub participant: Account<'info, Participant>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"vault".as_ref(), &challenge_id.to_le_bytes()],
        bump,
    )]
    /// CHECK: This is the vault PDA that will hold the funds
    pub vault: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(challenge_id: u64, step_count: u32, verification_day: u16)]
pub struct SubmitVerification<'info> {
    #[account(
        seeds = [b"challenge".as_ref(), &challenge_id.to_le_bytes()],
        bump = challenge.bump,
    )]
    pub challenge: Account<'info, Challenge>,
    
    #[account(
        mut,
        seeds = [
            b"participant".as_ref(),
            user.key().as_ref(),
            &challenge_id.to_le_bytes()
        ],
        bump,
        constraint = participant.wallet == user.key()
    )]
    pub participant: Account<'info, Participant>,
    
    pub user: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(challenge_id: u64)]
pub struct ProcessRewards<'info> {
    #[account(
        mut,
        seeds = [b"challenge".as_ref(), &challenge_id.to_le_bytes()],
        bump = challenge.bump,
    )]
    pub challenge: Account<'info, Challenge>,
    
    pub authority: Signer<'info>,
    
    /// CHECK: Used to iterate through all participants for this challenge
    /// This is a remaining accounts array passed in at runtime
    pub challenge_participants_list: UncheckedAccount<'info>,
}

#[derive(Accounts)]
#[instruction(challenge_id: u64)]
pub struct WithdrawReward<'info> {
    #[account(
        seeds = [b"challenge".as_ref(), &challenge_id.to_le_bytes()],
        bump = challenge.bump,
    )]
    pub challenge: Account<'info, Challenge>,
    
    #[account(
        mut,
        seeds = [
            b"participant".as_ref(),
            user.key().as_ref(),
            &challenge_id.to_le_bytes()
        ],
        bump,
        constraint = participant.wallet == user.key()
    )]
    pub participant: Account<'info, Participant>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"vault".as_ref(), &challenge_id.to_le_bytes()],
        bump,
    )]
    /// CHECK: This is the vault PDA that will hold the funds
    pub vault: UncheckedAccount<'info>,
    
    /// CHECK: Used to iterate through all participants for this challenge
    /// This is a remaining accounts array passed in at runtime
    pub challenge_participants_list: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}