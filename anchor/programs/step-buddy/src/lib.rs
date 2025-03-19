use anchor_lang::prelude::*;

declare_id!("7ns8ZDBia5ySTiqesdAmiWNC4knW4NnhXc5B12btky7w");

#[program]
pub mod step_buddy {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
