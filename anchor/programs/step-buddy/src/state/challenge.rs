use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Challenge {
    pub challenge_id: u64,            
    pub authority: Pubkey,           
    pub step_goal: u32,               
    pub duration_days: u16,           
    pub entry_amount: u64,            
    pub max_participants: u16,        
    pub participant_count: u16,       
    pub total_pool: u64,              
    pub start_timestamp: i64,         
    pub end_timestamp: i64,           
    pub is_active: bool,              
    pub is_completed: bool,           
    pub successful_participants: u16, 
    pub bump: u8,                     
}

impl Challenge {
    pub const SIZE: usize = 8 + 32 + 4 + 2 + 8 + 2 + 2 + 8 + 8 + 8 + 1 + 1 + 2 + 1;
}