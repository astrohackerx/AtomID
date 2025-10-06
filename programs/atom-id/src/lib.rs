use anchor_lang::prelude::*;

declare_id!("FM3RuwjHdDHyhXbMCucVaoM512wkjGvePxgefZ4C7gGM");

#[program]
pub mod atom_id {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
