use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::ErrorCode;

pub fn submit_verification(
    ctx: Context<SubmitVerification>,
    _challenge_id: u64,
    step_count: u32,
    verification_day: u16,
) -> Result<()> {
    let challenge = &ctx.accounts.challenge;
    let participant = &mut ctx.accounts.participant;
    
    // Validate
    require!(challenge.is_active, ErrorCode::ChallengeNotActive);
    require!(!challenge.is_completed, ErrorCode::ChallengeCompleted);
    require!(verification_day < challenge.duration_days, ErrorCode::InvalidVerificationDay);
    
    // Check if step goal was met
    if step_count >= challenge.step_goal {
        // Make sure we don't double count a day
        if !participant.daily_completions[verification_day as usize] {
            participant.daily_completions[verification_day as usize] = true;
            participant.total_successful_days += 1;
            
            msg!("Verification successful for day {}: {} steps", verification_day, step_count);
        } else {
            msg!("Day {} already verified successfully", verification_day);
        }
    } else {
        msg!("Step goal not met for day {}: {} steps", verification_day, step_count);
    }
    
    Ok(())
}