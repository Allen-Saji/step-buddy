use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::ErrorCode;
pub fn process_rewards<'info>(
    ctx: Context<'_, '_, 'info, 'info, ProcessRewards<'info>>, 
    challenge_id: u64
) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge;
    let authority = &ctx.accounts.authority;
    
    // Only challenge authority can process rewards
    require!(
        authority.key() == challenge.authority,
        ErrorCode::Unauthorized
    );
    
    // Validate challenge is active and can be completed
    require!(challenge.is_active, ErrorCode::ChallengeNotActive);
    require!(!challenge.is_completed, ErrorCode::ChallengeAlreadyCompleted);
    
    // Check if challenge has ended
    let clock = Clock::get()?;
    require!(
        clock.unix_timestamp >= challenge.end_timestamp,
        ErrorCode::ChallengeNotEnded
    );
    
    // Count successful participants using remaining_accounts
    let mut successful_count = 0u16;
    
    // Note: Client should pass in all participant accounts as remaining_accounts
    for account in ctx.remaining_accounts {
        // We can use the try_from here because we're not storing the result
        if let Ok(participant) = Account::<Participant>::try_from(account) {
            if participant.challenge_id == challenge_id && 
               participant.total_successful_days == challenge.duration_days {
                successful_count += 1;
            }
        }
    }
    
    // Update challenge with successful participant count
    challenge.successful_participants = successful_count;
    
    // Mark challenge as completed
    challenge.is_active = false;
    challenge.is_completed = true;
    
    msg!("Challenge {} completed with {} successful participants", 
         challenge_id, successful_count);
    Ok(())
}
pub fn withdraw_reward(ctx: Context<WithdrawReward>, challenge_id: u64) -> Result<()> {
    let challenge = &ctx.accounts.challenge;
    let participant = &mut ctx.accounts.participant;
    let user = &ctx.accounts.user;
    let vault = &ctx.accounts.vault;
    
    // Validate challenge is completed
    require!(challenge.is_completed, ErrorCode::ChallengeNotCompleted);
    
    // Check if user has already withdrawn
    require!(!participant.has_withdrawn, ErrorCode::AlreadyWithdrawn);
    
    // Calculate if user met the threshold (completed all days)
    let is_successful = participant.total_successful_days == challenge.duration_days;
    
    if is_successful {
        // Use the successful_participants count from the challenge account
        // Note: This should be set during process_rewards
        let successful_count = challenge.successful_participants;
        
        // Calculate reward (original stake + share of forfeited amount)
        let forfeited_amount = challenge.total_pool - (successful_count as u64 * challenge.entry_amount);
        let reward_share = if successful_count > 0 {
            forfeited_amount / successful_count as u64
        } else {
            0
        };
        
        let reward_amount = challenge.entry_amount + reward_share;
        
        // Transfer reward to user
        let seeds = &[
            b"vault".as_ref(),
            &challenge.challenge_id.to_le_bytes(),
            &[challenge.bump]
        ];
        let signer = &[&seeds[..]];
        
        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: vault.to_account_info(),
                to: user.to_account_info(),
            },
            signer,
        );
        
        anchor_lang::system_program::transfer(cpi_context, reward_amount)?;
        
        msg!("Withdrew reward of {} lamports for challenge {}", reward_amount, challenge_id);
    }
    
    // Mark as withdrawn regardless
    participant.has_withdrawn = true;
    
    Ok(())
}