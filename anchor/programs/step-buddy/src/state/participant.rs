
use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Participant {
    pub wallet: Pubkey,               
    pub challenge_id: u64,             
    pub daily_completions: Vec<bool>,  // 4 + (n * 1) bytes, where n is the number of days
    pub total_successful_days: u16,    
    pub has_withdrawn: bool,           
}

impl Participant {
    // Account size depends on the challenge duration
    // Base size plus vector size (max 30 days to keep it reasonable)
    pub const SIZE: usize = 32 + 8 + 4 + (30 * 1) + 2 + 1;
}