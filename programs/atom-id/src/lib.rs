use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Token};

declare_id!("9ntZFb85wU5zng1rM6pTnzbcm9S4s8iTMvhBUYyLZQc1");

#[program]
pub mod atom_id {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        min_create_burn: u64,
        rank_thresholds: Vec<u64>,
        burn_mint: Pubkey,
    ) -> Result<()> {
        require!(
            rank_thresholds.len() <= 10,
            ErrorCode::TooManyRankThresholds
        );

        let mut sorted_thresholds = rank_thresholds.clone();
        sorted_thresholds.sort();
        require!(
            sorted_thresholds == rank_thresholds,
            ErrorCode::RankThresholdsNotSorted
        );

        let config = &mut ctx.accounts.atom_config;
        config.admin = ctx.accounts.admin.key();
        config.min_create_burn = min_create_burn;
        config.rank_thresholds = rank_thresholds;
        config.burn_mint = burn_mint;
        config.bump = ctx.bumps.atom_config;

        emit!(ConfigInitialized {
            admin: config.admin,
            min_create_burn,
            burn_mint,
        });

        Ok(())
    }

    pub fn create_atomid(
        ctx: Context<CreateAtomId>,
        burn_amount: u64,
        metadata: Option<String>,
    ) -> Result<()> {
        let config = &ctx.accounts.atom_config;

        require!(
            ctx.accounts.atom_mint.key() == config.burn_mint,
            ErrorCode::InvalidBurnMint
        );

        require!(
            ctx.accounts.token_program.key() == anchor_spl::token::ID,
            ErrorCode::InvalidTokenProgram
        );

        require!(
            burn_amount >= config.min_create_burn,
            ErrorCode::InsufficientBurnAmount
        );

        if let Some(ref meta) = metadata {
            require!(meta.len() <= 200, ErrorCode::MetadataTooLong);
        }

        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.atom_mint.to_account_info(),
                    from: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            burn_amount,
        )?;

        let current_slot = Clock::get()?.slot;
        let atom_id = &mut ctx.accounts.atom_id;

        atom_id.owner = ctx.accounts.user.key();
        atom_id.total_burned = burn_amount;
        atom_id.rank = calculate_rank(burn_amount, &config.rank_thresholds);
        atom_id.metadata = metadata.unwrap_or_default();
        atom_id.created_at_slot = current_slot;
        atom_id.updated_at_slot = current_slot;
        atom_id.bump = ctx.bumps.atom_id;

        emit!(AtomIdCreated {
            owner: atom_id.owner,
            total_burned: atom_id.total_burned,
            rank: atom_id.rank,
        });

        Ok(())
    }

    pub fn upgrade_atomid(
        ctx: Context<UpgradeAtomId>,
        burn_amount: u64,
        metadata: Option<String>,
    ) -> Result<()> {
        let config = &ctx.accounts.atom_config;

        require!(
            ctx.accounts.atom_mint.key() == config.burn_mint,
            ErrorCode::InvalidBurnMint
        );

        require!(
            ctx.accounts.token_program.key() == anchor_spl::token::ID,
            ErrorCode::InvalidTokenProgram
        );

        require!(burn_amount > 0, ErrorCode::InsufficientBurnAmount);

        if let Some(ref meta) = metadata {
            require!(meta.len() <= 200, ErrorCode::MetadataTooLong);
        }

        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.atom_mint.to_account_info(),
                    from: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            burn_amount,
        )?;

        let atom_id = &mut ctx.accounts.atom_id;
        let old_rank = atom_id.rank;

        atom_id.total_burned = atom_id
            .total_burned
            .checked_add(burn_amount)
            .ok_or(ErrorCode::Overflow)?;

        atom_id.rank = calculate_rank(atom_id.total_burned, &config.rank_thresholds);
        atom_id.updated_at_slot = Clock::get()?.slot;

        if let Some(meta) = metadata {
            atom_id.metadata = meta;
        }

        emit!(AtomIdUpgraded {
            owner: atom_id.owner,
            total_burned: atom_id.total_burned,
            old_rank,
            new_rank: atom_id.rank,
        });

        Ok(())
    }

    pub fn update_metadata(
        ctx: Context<UpdateMetadata>,
        new_metadata: String,
    ) -> Result<()> {
        require!(
            new_metadata.len() <= 200,
            ErrorCode::MetadataTooLong
        );

        let atom_id = &mut ctx.accounts.atom_id;
        atom_id.metadata = new_metadata;
        atom_id.updated_at_slot = Clock::get()?.slot;

        Ok(())
    }

    pub fn admin_update_config(
        ctx: Context<AdminUpdateConfig>,
        min_create_burn: Option<u64>,
        rank_thresholds: Option<Vec<u64>>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.atom_config;

        if let Some(min_burn) = min_create_burn {
            config.min_create_burn = min_burn;
        }

        if let Some(thresholds) = rank_thresholds {
            require!(
                thresholds.len() <= 10,
                ErrorCode::TooManyRankThresholds
            );

            let mut sorted = thresholds.clone();
            sorted.sort();
            require!(
                sorted == thresholds,
                ErrorCode::RankThresholdsNotSorted
            );

            config.rank_thresholds = thresholds;
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + AtomConfig::INIT_SPACE,
        seeds = [b"atomid_config"],
        bump
    )]
    pub atom_config: Account<'info, AtomConfig>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateAtomId<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + AtomId::INIT_SPACE,
        seeds = [b"atomid", user.key().as_ref()],
        bump
    )]
    pub atom_id: Account<'info, AtomId>,

    #[account(
        seeds = [b"atomid_config"],
        bump = atom_config.bump
    )]
    pub atom_config: Account<'info, AtomConfig>,

    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: Validated in instruction handler
    #[account(mut)]
    pub user_token_account: AccountInfo<'info>,

    /// CHECK: Validated in instruction handler
    #[account(mut)]
    pub atom_mint: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpgradeAtomId<'info> {
    #[account(
        mut,
        seeds = [b"atomid", user.key().as_ref()],
        bump = atom_id.bump,
        constraint = atom_id.owner == user.key() @ ErrorCode::Unauthorized
    )]
    pub atom_id: Account<'info, AtomId>,

    #[account(
        seeds = [b"atomid_config"],
        bump = atom_config.bump
    )]
    pub atom_config: Account<'info, AtomConfig>,

    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: Validated in instruction handler
    #[account(mut)]
    pub user_token_account: AccountInfo<'info>,

    /// CHECK: Validated in instruction handler
    #[account(mut)]
    pub atom_mint: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateMetadata<'info> {
    #[account(
        mut,
        seeds = [b"atomid", user.key().as_ref()],
        bump = atom_id.bump,
        constraint = atom_id.owner == user.key() @ ErrorCode::Unauthorized
    )]
    pub atom_id: Account<'info, AtomId>,

    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct AdminUpdateConfig<'info> {
    #[account(
        mut,
        seeds = [b"atomid_config"],
        bump = atom_config.bump,
        constraint = atom_config.admin == admin.key() @ ErrorCode::Unauthorized
    )]
    pub atom_config: Account<'info, AtomConfig>,

    pub admin: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct AtomId {
    pub owner: Pubkey,
    pub total_burned: u64,
    pub rank: u8,
    #[max_len(200)]
    pub metadata: String,
    pub created_at_slot: u64,
    pub updated_at_slot: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct AtomConfig {
    pub admin: Pubkey,
    pub min_create_burn: u64,
    #[max_len(10)]
    pub rank_thresholds: Vec<u64>,
    pub burn_mint: Pubkey,
    pub bump: u8,
}

fn calculate_rank(total_burned: u64, thresholds: &[u64]) -> u8 {
    for (i, &threshold) in thresholds.iter().enumerate().rev() {
        if total_burned >= threshold {
            return (i + 1) as u8;
        }
    }
    0
}

#[event]
pub struct ConfigInitialized {
    pub admin: Pubkey,
    pub min_create_burn: u64,
    pub burn_mint: Pubkey,
}

#[event]
pub struct AtomIdCreated {
    pub owner: Pubkey,
    pub total_burned: u64,
    pub rank: u8,
}

#[event]
pub struct AtomIdUpgraded {
    pub owner: Pubkey,
    pub total_burned: u64,
    pub old_rank: u8,
    pub new_rank: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Burn amount is below minimum required")]
    InsufficientBurnAmount,
    #[msg("Metadata exceeds maximum length of 200 characters")]
    MetadataTooLong,
    #[msg("Invalid burn mint address")]
    InvalidBurnMint,
    #[msg("Invalid token account")]
    InvalidTokenAccount,
    #[msg("Invalid token program")]
    InvalidTokenProgram,
    #[msg("Unauthorized: not the owner or admin")]
    Unauthorized,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Too many rank thresholds (max 10)")]
    TooManyRankThresholds,
    #[msg("Rank thresholds must be sorted in ascending order")]
    RankThresholdsNotSorted,
}
