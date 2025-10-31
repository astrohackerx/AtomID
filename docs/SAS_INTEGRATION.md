# Solana Attestation Service Integration for AtomID

## Overview

AtomID now issues verifiable on-chain attestations through direct integration with the Solana Attestation Service (SAS). This allows any Solana protocol to instantly verify and check AtomID ranks without needing to query the AtomID program directly.

## What Was Implemented

### 1. SAS Client Integration

Added dependencies to `programs/atom-id/Cargo.toml`:
- `solana-attestation-service-client = "1.0.9"`
- `solana-program = "2.1.13"`

### 2. SAS Integration Module (`sas_integration.rs`)

Created helper functions for:
- **PDA Derivation**: `derive_attestation_pda()` - Derives attestation account addresses
- **Data Serialization**: `serialize_atomid_attestation_data()` - Packs rank, total_burned, and created_at_slot into attestation data
- **CPI Instructions**:
  - `create_attestation_instruction()` - Builds instruction to create attestations
  - `close_attestation_instruction()` - Builds instruction to close/revoke attestations

### 3. AtomID Attestation Schema

**Schema Structure:**
```
Field 1 (U8):  rank (0-10)
Field 2 (U64): total_burned
Field 3 (U64): created_at_slot
```

**Layout array**: `[0, 3, 3]`
- 0 = U8 (rank)
- 3 = U64 (total_burned)
- 3 = U64 (created_at_slot)

**Field names**: `["rank", "total_burned", "created_at_slot"]`

### 4. Updated AtomConfig

Added three new fields to store SAS account addresses:
- `sas_credential`: The AtomID issuer credential PDA
- `sas_schema`: The AtomID rank schema PDA
- `sas_authority`: The authorized signer for issuing attestations

### 5. Updated Instructions

#### `create_atomid`
- Now accepts 4 additional accounts: `sas_attestation`, `sas_credential`, `sas_schema`, `sas_authority`
- After burning ATOM and creating the AtomID, issues an attestation via CPI to SAS
- Attestation contains the user's rank and burn data

#### `upgrade_atomid`
- Now accepts 6 additional accounts including old/new attestation PDAs and SAS event authority
- First closes the old attestation (to update rank on-chain)
- Burns additional ATOM and updates the AtomID
- Issues a new attestation with updated rank and total_burned

## Setup Required (Before Deployment)

### Step 1: Create SAS Credential

The AtomID program admin needs to create a credential account on SAS:

```typescript
import { createCredential } from 'solana-attestation-service-client';

// Derive the credential PDA
const [credentialPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("credential"), adminKeypair.publicKey.toBuffer()],
  SAS_PROGRAM_ID
);

// Create the credential
await createCredential({
  payer: adminKeypair.publicKey,
  credential: credentialPda,
  authority: adminKeypair.publicKey,
  systemProgram: SystemProgram.programId,
  name: "AtomID",
  signers: [authorizedSigner.publicKey], // Can be same as admin
});
```

### Step 2: Create AtomID Schema

Create the schema that defines the attestation structure:

```typescript
import { createSchema } from 'solana-attestation-service-client';

const [schemaPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("schema"),
    credentialPda.toBuffer(),
    Buffer.from("atomid_rank_v1"),
  ],
  SAS_PROGRAM_ID
);

await createSchema({
  payer: adminKeypair.publicKey,
  authority: adminKeypair.publicKey,
  credential: credentialPda,
  schema: schemaPda,
  systemProgram: SystemProgram.programId,
  name: "atomid_rank_v1",
  description: "AtomID rank attestation: Proof of ATOM burned and trust level",
  layout: [0, 3, 3], // U8, U64, U64
  fieldNames: ["rank", "total_burned", "created_at_slot"],
});
```

### Step 3: Initialize AtomID Config

When initializing the AtomID program, include the SAS account addresses:

```typescript
await program.methods
  .initialize(
    minCreateBurn,
    rankThresholds,
    burnMint,
    credentialPda,      // SAS credential
    schemaPda,          // SAS schema
    authorizedSigner.publicKey  // SAS authority
  )
  .accounts({
    atomConfig: configPda,
    admin: adminKeypair.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([adminKeypair])
  .rpc();
```

## How to Use AtomID Attestations

### For Users Creating AtomIDs

When calling `create_atomid`, derive the attestation PDA:

```typescript
const [attestationPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("attestation"),
    credentialPda.toBuffer(),
    schemaPda.toBuffer(),
    userWallet.publicKey.toBuffer(), // nonce = user pubkey
  ],
  SAS_PROGRAM_ID
);

await atomIdProgram.methods
  .createAtomid(burnAmount, metadata)
  .accounts({
    atomId: atomIdPda,
    atomConfig: configPda,
    user: userWallet.publicKey,
    userTokenAccount: userTokenAccount,
    atomMint: atomMint,
    sasAttestation: attestationPda,
    sasCredential: credentialPda,
    sasSchema: schemaPda,
    sasAuthority: authorizedSigner.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .signers([userWallet, authorizedSigner])
  .rpc();
```

### For Users Upgrading AtomIDs

When upgrading, you need both old and new attestation PDAs:

```typescript
// Old attestation uses previous nonce (user pubkey)
const [oldAttestationPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("attestation"),
    credentialPda.toBuffer(),
    schemaPda.toBuffer(),
    userWallet.publicKey.toBuffer(),
  ],
  SAS_PROGRAM_ID
);

// New attestation uses a different nonce (e.g., hash of user + timestamp)
const newNonce = // Generate unique nonce
const [newAttestationPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("attestation"),
    credentialPda.toBuffer(),
    schemaPda.toBuffer(),
    newNonce.toBuffer(),
  ],
  SAS_PROGRAM_ID
);

// Get SAS event authority PDA
const [eventAuthority] = PublicKey.findProgramAddressSync(
  [Buffer.from("__event_authority")],
  SAS_PROGRAM_ID
);

await atomIdProgram.methods
  .upgradeAtomid(burnAmount, metadata)
  .accounts({
    atomId: atomIdPda,
    atomConfig: configPda,
    user: userWallet.publicKey,
    userTokenAccount: userTokenAccount,
    atomMint: atomMint,
    oldSasAttestation: oldAttestationPda,
    newSasAttestation: newAttestationPda,
    sasCredential: credentialPda,
    sasSchema: schemaPda,
    sasAuthority: authorizedSigner.publicKey,
    sasEventAuthority: eventAuthority,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .signers([userWallet, authorizedSigner])
  .rpc();
```

### For Protocols Verifying AtomID Ranks

Any Solana protocol can now verify a user's AtomID rank by reading their attestation:

```typescript
import { fetchAttestation } from 'solana-attestation-service-client';

// Derive user's attestation PDA
const [attestationPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("attestation"),
    ATOMID_CREDENTIAL_PDA.toBuffer(),
    ATOMID_SCHEMA_PDA.toBuffer(),
    userWallet.toBuffer(),
  ],
  SAS_PROGRAM_ID
);

// Fetch the attestation
const attestation = await fetchAttestation(connection, attestationPda);

// Deserialize the data
const rank = attestation.data[0]; // First byte is rank (U8)
const totalBurned = Buffer.from(attestation.data.slice(1, 9)).readBigUInt64LE();
const createdAt = Buffer.from(attestation.data.slice(9, 17)).readBigUInt64LE();

// Use the rank for access control
if (rank >= 5) {
  // Allow access to premium features
}
```

## Benefits

1. **Permissionless Verification**: Any protocol can verify AtomID ranks without needing AtomID program integration
2. **Standard Format**: Uses industry-standard SAS attestation format recognized across Solana
3. **Decentralized Trust**: Attestations are on-chain and cryptographically verifiable
4. **Composability**: DEXs, DAOs, marketplaces, and social dApps can all read the same attestations
5. **No Additional Queries**: Protocols don't need to query the AtomID program directly

## Use Cases Enabled

- **DEX Integration**: Gate certain trading pairs or features by AtomID rank
- **DAO Governance**: Weight votes by AtomID rank (proof of sacrifice)
- **Marketplace Benefits**: Offer discounts or priority to high-rank AtomID holders
- **Social dApps**: Verify real participation through verifiable burn proofs
- **Airdrops**: Distribute tokens based on AtomID rank
- **Reputation Systems**: Build trust scores from on-chain sacrifice

## Constants

- **SAS Program ID**: `22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG`
- **Event Authority PDA**: Derived from seed `__event_authority`
- **Attestation Seed**: `attestation`
- **Credential Seed**: `credential`
- **Schema Seed**: `schema`

## Security Notes

- The `sas_authority` must sign all attestation creation/closure operations
- Attestations can only be issued by the authorized signer in the credential
- Old attestations are closed before new ones are created during upgrades
- All SAS account addresses are validated against the config during instructions
