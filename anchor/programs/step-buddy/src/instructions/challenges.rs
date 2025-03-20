use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::ErrorCode;

pub fn initialize_challenge(
    ctx: Context<InitializeChallenge>,
    challenge_id: u64,
    step_goal: u32,
    duration_days: u16,
    entry_amount: u64,
    max_participants: u16,
) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge;
    let authority = &ctx.accounts.authority;
    let clock = Clock::get()?;

    // Initialize challenge data
    challenge.challenge_id = challenge_id;
    challenge.authority = authority.key();
    challenge.step_goal = step_goal;
    challenge.duration_days = duration_days;
    challenge.entry_amount = entry_amount;
    challenge.max_participants = max_participants;
    challenge.participant_count = 0;
    challenge.total_pool = 0;
    challenge.start_timestamp = clock.unix_timestamp;
    challenge.end_timestamp = clock.unix_timestamp + (duration_days as i64 * 86400); // 86400 seconds in a day
    challenge.is_active = true;
    challenge.is_completed = false;
    challenge.successful_participants = 0;
    challenge.bump = ctx.bumps.challenge;

    msg!("Challenge initialized with ID: {}", challenge_id);
    Ok(())
}

pub fn join_challenge(ctx: Context<JoinChallenge>, challenge_id: u64) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge;
    let participant_account = &mut ctx.accounts.participant;
    let user = &ctx.accounts.user;
    let vault = &ctx.accounts.vault;
    let system_program = &ctx.accounts.system_program;

    // Validate challenge is active
    require!(challenge.is_active, ErrorCode::ChallengeNotActive);
    require!(!challenge.is_completed, ErrorCode::ChallengeCompleted);
    
    // Check if challenge has space
    require!(
        challenge.participant_count < challenge.max_participants,
        ErrorCode::ChallengeFull
    );

    // Check if current time is before end time
    let clock = Clock::get()?;
    require!(
        clock.unix_timestamp < challenge.end_timestamp,
        ErrorCode::ChallengeEnded
    );

    // Initialize participant data
    participant_account.wallet = user.key();
    participant_account.challenge_id = challenge_id;
    participant_account.total_successful_days = 0;
    participant_account.has_withdrawn = false;
    
    // Create daily completions array initialized to false
    participant_account.daily_completions = vec![false; challenge.duration_days as usize];
    
    // Transfer entry amount to vault
    let cpi_context = CpiContext::new(
        system_program.to_account_info(),
        anchor_lang::system_program::Transfer {
            from: user.to_account_info(),
            to: vault.to_account_info(),
        },
    );
    
    anchor_lang::system_program::transfer(cpi_context, challenge.entry_amount)?;
    
    // Update challenge data
    challenge.participant_count += 1;
    challenge.total_pool += challenge.entry_amount;

    msg!("User joined challenge: {}", challenge_id);
    Ok(())
}