use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Token};

mod sas_integration;
use sas_integration::*;

declare_id!("334fZWRf33wfDSuF1837w4mSQTgTd6r4XjgdLX8TNRjo");

#[program]
pub mod atom_id {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        min_create_burn: u64,
        rank_thresholds: Vec<u64>,
        burn_mint: Pubkey,
        sas_credential: Pubkey,
        sas_schema: Pubkey,
        sas_authority: Pubkey,
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
        config.sas_credential = sas_credential;
        config.sas_schema = sas_schema;
        config.sas_authority = sas_authority;
        config.bump = ctx.bumps.atom_config;

        emit!(ConfigInitialized {
            admin: config.admin,
            min_create_burn,
            burn_mint,
        });

        Ok(())
    }

    pub fn initialize_sas_credential(
        ctx: Context<InitializeSasCredential>,
        name: String,
        description: String,
    ) -> Result<()> {
        let credential_ix = create_credential_instruction(
            ctx.accounts.payer.key(),
            ctx.accounts.sas_authority.key(),
            ctx.accounts.sas_credential.key(),
            ctx.accounts.system_program.key(),
            name,
            description,
            vec![ctx.accounts.sas_authority.key()],
        )?;

        let signer_seeds: &[&[&[u8]]] = &[&[
            b"sas_authority",
            &[ctx.bumps.sas_authority],
        ]];

        anchor_lang::solana_program::program::invoke_signed(
            &credential_ix,
            &[
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.sas_authority.to_account_info(),
                ctx.accounts.sas_credential.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            signer_seeds,
        )?;

        Ok(())
    }

    pub fn initialize_sas_schema(
        ctx: Context<InitializeSasSchema>,
        name: String,
        description: String,
        layout: Vec<u8>,
        field_names: Vec<String>,
    ) -> Result<()> {
        let schema_ix = create_schema_instruction(
            ctx.accounts.payer.key(),
            ctx.accounts.sas_authority.key(),
            ctx.accounts.sas_credential.key(),
            ctx.accounts.sas_schema.key(),
            ctx.accounts.system_program.key(),
            name,
            description,
            layout,
            field_names,
        )?;

        let signer_seeds: &[&[&[u8]]] = &[&[
            b"sas_authority",
            &[ctx.bumps.sas_authority],
        ]];

        anchor_lang::solana_program::program::invoke_signed(
            &schema_ix,
            &[
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.sas_authority.to_account_info(),
                ctx.accounts.sas_credential.to_account_info(),
                ctx.accounts.sas_schema.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            signer_seeds,
        )?;

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

        require!(
            ctx.accounts.sas_credential.key() == config.sas_credential,
            ErrorCode::InvalidSasCredential
        );

        require!(
            ctx.accounts.sas_schema.key() == config.sas_schema,
            ErrorCode::InvalidSasSchema
        );

        require!(
            ctx.accounts.sas_authority.key() == config.sas_authority,
            ErrorCode::InvalidSasAuthority
        );

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

        let attestation_data = serialize_atomid_attestation_data(
            atom_id.rank,
            atom_id.total_burned,
            atom_id.created_at_slot,
        );

        msg!("Attestation data length: {}", attestation_data.len());
        msg!("Attestation data: {:?}", attestation_data);

        let expiry_timestamp = Clock::get()?.unix_timestamp + (365 * 24 * 60 * 60);

        let attestation_ix = create_attestation_instruction(
            ctx.accounts.user.key(),
            ctx.accounts.sas_authority.key(),
            config.sas_credential,
            config.sas_schema,
            ctx.accounts.sas_attestation.key(),
            ctx.accounts.system_program.key(),
            ctx.accounts.user.key(),
            attestation_data,
            expiry_timestamp,
        )?;

        let signer_seeds: &[&[&[u8]]] = &[&[
            b"sas_authority",
            &[ctx.bumps.sas_authority],
        ]];

        let account_infos = [
            ctx.accounts.user.to_account_info(),
            ctx.accounts.sas_authority.to_account_info(),
            ctx.accounts.sas_credential.to_account_info(),
            ctx.accounts.sas_schema.to_account_info(),
            ctx.accounts.sas_attestation.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ];

        anchor_lang::solana_program::program::invoke_signed(
            &attestation_ix,
            &account_infos,
            signer_seeds,
        )?;

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

        require!(
            ctx.accounts.sas_credential.key() == config.sas_credential,
            ErrorCode::InvalidSasCredential
        );

        require!(
            ctx.accounts.sas_schema.key() == config.sas_schema,
            ErrorCode::InvalidSasSchema
        );

        require!(
            ctx.accounts.sas_authority.key() == config.sas_authority,
            ErrorCode::InvalidSasAuthority
        );

        let close_ix = close_attestation_instruction(
            ctx.accounts.user.key(),
            ctx.accounts.sas_authority.key(),
            config.sas_credential,
            ctx.accounts.old_sas_attestation.key(),
            ctx.accounts.sas_event_authority.key(),
            ctx.accounts.system_program.key(),
        )?;

        let signer_seeds: &[&[&[u8]]] = &[&[
            b"sas_authority",
            &[ctx.bumps.sas_authority],
        ]];

        anchor_lang::solana_program::program::invoke_signed(
            &close_ix,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.sas_authority.to_account_info(),
                ctx.accounts.sas_credential.to_account_info(),
                ctx.accounts.old_sas_attestation.to_account_info(),
                ctx.accounts.sas_event_authority.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.sas_program.to_account_info(),
            ],
            signer_seeds,
        )?;

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

        let attestation_data = serialize_atomid_attestation_data(
            atom_id.rank,
            atom_id.total_burned,
            atom_id.created_at_slot,
        );

        let expiry_timestamp = Clock::get()?.unix_timestamp + (365 * 24 * 60 * 60);

        let attestation_ix = create_attestation_instruction(
            ctx.accounts.user.key(),
            ctx.accounts.sas_authority.key(),
            config.sas_credential,
            config.sas_schema,
            ctx.accounts.new_sas_attestation.key(),
            ctx.accounts.system_program.key(),
            ctx.accounts.user.key(),
            attestation_data,
            expiry_timestamp,
        )?;

        let signer_seeds: &[&[&[u8]]] = &[&[
            b"sas_authority",
            &[ctx.bumps.sas_authority],
        ]];

        anchor_lang::solana_program::program::invoke_signed(
            &attestation_ix,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.sas_authority.to_account_info(),
                ctx.accounts.sas_credential.to_account_info(),
                ctx.accounts.sas_schema.to_account_info(),
                ctx.accounts.new_sas_attestation.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            signer_seeds,
        )?;

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

    /// Print security.txt to program logs for verification
    pub fn print_security_txt(_ctx: Context<PrintSecurityTxt>) -> Result<()> {
        let security_txt = include_str!("security.txt");
        msg!("security_txt: {}", security_txt);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct PrintSecurityTxt {}

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
pub struct InitializeSasCredential<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        seeds = [b"sas_authority"],
        bump
    )]
    /// CHECK: PDA used to sign SAS operations
    pub sas_authority: UncheckedAccount<'info>,

    /// CHECK: Created by SAS program
    #[account(mut)]
    pub sas_credential: UncheckedAccount<'info>,

    /// CHECK: SAS program
    pub sas_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeSasSchema<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        seeds = [b"sas_authority"],
        bump
    )]
    /// CHECK: PDA used to sign SAS operations
    pub sas_authority: UncheckedAccount<'info>,

    /// CHECK: Created by SAS program
    pub sas_credential: UncheckedAccount<'info>,

    /// CHECK: Created by SAS program
    #[account(mut)]
    pub sas_schema: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: SAS program for CPI
    pub sas_program: UncheckedAccount<'info>,
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

    /// CHECK: SAS attestation PDA - will be created by SAS program via CPI
    #[account(mut)]
    pub sas_attestation: UncheckedAccount<'info>,

    /// CHECK: SAS credential account from config
    pub sas_credential: AccountInfo<'info>,

    /// CHECK: SAS schema account from config
    pub sas_schema: AccountInfo<'info>,

    /// CHECK: SAS authority PDA
    #[account(
        seeds = [b"sas_authority"],
        bump
    )]
    pub sas_authority: AccountInfo<'info>,

    /// CHECK: SAS program account
    pub sas_program: AccountInfo<'info>,

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

    /// CHECK: Old SAS attestation PDA to be closed - owned by SAS program
    #[account(mut)]
    pub old_sas_attestation: UncheckedAccount<'info>,

    /// CHECK: New SAS attestation PDA - will be created by SAS program via CPI
    #[account(mut)]
    pub new_sas_attestation: UncheckedAccount<'info>,

    /// CHECK: SAS credential account from config
    pub sas_credential: AccountInfo<'info>,

    /// CHECK: SAS schema account from config
    pub sas_schema: AccountInfo<'info>,

    /// CHECK: SAS authority PDA
    #[account(
        seeds = [b"sas_authority"],
        bump
    )]
    pub sas_authority: AccountInfo<'info>,

    /// CHECK: SAS event authority PDA
    pub sas_event_authority: AccountInfo<'info>,

    /// CHECK: SAS program account
    pub sas_program: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
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
    pub sas_credential: Pubkey,
    pub sas_schema: Pubkey,
    pub sas_authority: Pubkey,
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
    #[msg("Invalid SAS credential address")]
    InvalidSasCredential,
    #[msg("Invalid SAS schema address")]
    InvalidSasSchema,
    #[msg("Invalid SAS authority")]
    InvalidSasAuthority,
}
