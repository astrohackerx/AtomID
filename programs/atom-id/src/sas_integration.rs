use anchor_lang::prelude::*;
use solana_attestation_service_client::instructions::{
    CreateAttestation, CreateAttestationInstructionArgs, CloseAttestation,
};

pub const SAS_PROGRAM_ID: Pubkey = solana_program::pubkey!("22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG");

pub fn derive_attestation_pda(
    credential: &Pubkey,
    schema: &Pubkey,
    nonce: &Pubkey,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            b"attestation",
            credential.as_ref(),
            schema.as_ref(),
            nonce.as_ref(),
        ],
        &SAS_PROGRAM_ID,
    )
}

pub fn serialize_atomid_attestation_data(rank: u8, total_burned: u64, created_at_slot: u64) -> Vec<u8> {
    let mut data = Vec::new();
    data.push(rank);
    data.extend_from_slice(&total_burned.to_le_bytes());
    data.extend_from_slice(&created_at_slot.to_le_bytes());
    data
}

pub fn create_attestation_instruction(
    payer: Pubkey,
    authority: Pubkey,
    credential: Pubkey,
    schema: Pubkey,
    attestation: Pubkey,
    system_program: Pubkey,
    nonce: Pubkey,
    data: Vec<u8>,
    expiry: i64,
) -> Result<solana_program::instruction::Instruction> {
    let args = CreateAttestationInstructionArgs {
        nonce: solana_program::pubkey::Pubkey::from(nonce.to_bytes()),
        data,
        expiry,
    };

    let instruction_struct = CreateAttestation {
        payer: solana_program::pubkey::Pubkey::from(payer.to_bytes()),
        authority: solana_program::pubkey::Pubkey::from(authority.to_bytes()),
        credential: solana_program::pubkey::Pubkey::from(credential.to_bytes()),
        schema: solana_program::pubkey::Pubkey::from(schema.to_bytes()),
        attestation: solana_program::pubkey::Pubkey::from(attestation.to_bytes()),
        system_program: solana_program::pubkey::Pubkey::from(system_program.to_bytes()),
    };

    Ok(instruction_struct.instruction(args))
}

pub fn close_attestation_instruction(
    payer: Pubkey,
    authority: Pubkey,
    credential: Pubkey,
    attestation: Pubkey,
    event_authority: Pubkey,
    system_program: Pubkey,
) -> Result<solana_program::instruction::Instruction> {
    let instruction_struct = CloseAttestation {
        payer: solana_program::pubkey::Pubkey::from(payer.to_bytes()),
        authority: solana_program::pubkey::Pubkey::from(authority.to_bytes()),
        credential: solana_program::pubkey::Pubkey::from(credential.to_bytes()),
        attestation: solana_program::pubkey::Pubkey::from(attestation.to_bytes()),
        event_authority: solana_program::pubkey::Pubkey::from(event_authority.to_bytes()),
        system_program: solana_program::pubkey::Pubkey::from(system_program.to_bytes()),
        attestation_program: solana_program::pubkey::Pubkey::from(SAS_PROGRAM_ID.to_bytes()),
    };

    Ok(instruction_struct.instruction())
}
