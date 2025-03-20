use anchor_lang::prelude::*;

mod state;
mod instructions;
mod errors;

use state::*;
pub use errors::ErrorCode;

declare_id!("6j5EQpFzAXqrq2XiYvSDDSepLGaVAdKkPA3hBGMFx8Zm");

#[program]
pub mod step_buddy {
    use super::*;

    pub fn initialize_challenge(
        ctx: Context<InitializeChallenge>,
        challenge_id: u64,
        step_goal: u32,
        duration_days: u16,
        entry_amount: u64,
        max_participants: u16,
    ) -> Result<()> {
        instructions::challenges::initialize_challenge(
            ctx, 
            challenge_id, 
            step_goal, 
            duration_days, 
            entry_amount, 
            max_participants
        )
    }

    pub fn join_challenge(ctx: Context<JoinChallenge>, challenge_id: u64) -> Result<()> {
        instructions::challenges::join_challenge(ctx, challenge_id)
    }

    pub fn submit_verification(
        ctx: Context<SubmitVerification>,
        _challenge_id: u64,
        step_count: u32,
        verification_day: u16,
    ) -> Result<()> {
        instructions::verification::submit_verification(ctx,_challenge_id, step_count, verification_day)
    }

    pub fn process_rewards<'info>(
        ctx: Context<'_, '_, 'info, 'info, ProcessRewards<'info>>, 
        challenge_id: u64
    ) -> Result<()> {
        instructions::rewards::process_rewards(ctx, challenge_id)
    }

    pub fn withdraw_reward(ctx: Context<WithdrawReward>, challenge_id: u64) -> Result<()> {
        instructions::rewards::withdraw_reward(ctx, challenge_id)
    }
}