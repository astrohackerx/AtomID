# AtomID Deployment Steps

Follow these steps in order to deploy the AtomID protocol with SAS integration.

## Prerequisites

- Solana CLI installed
- Anchor CLI installed
- Wallet with SOL for deployment (devnet or mainnet)

## Step-by-Step Deployment

### 1. Build the Program

```bash
cd backend
anchor build
```

This compiles the Rust program and generates the IDL.

### 2. Deploy the Program

**For Devnet:**
```bash
anchor deploy --provider.cluster devnet
```

**For Mainnet:**
```bash
anchor deploy --provider.cluster mainnet
```

Note the program ID from the deployment output.

### 3. Copy IDL to Frontend

```bash
cp target/idl/atom_id.json ../src/lib/atom_id.json
```

### 4. Run SAS Setup Script

This creates the SAS credential and schema:

```bash
cd backend
yarn sas
```

**Important:** Save the output! You'll need:
- SAS Credential address
- SAS Schema address
- SAS Authority PDA (automatically calculated)

Example output:
```
const sasCredential = new PublicKey("ABC123...");
const sasSchema = new PublicKey("DEF456...");
const sasAuthority = new PublicKey("GHI789..."); // PDA owned by AtomID program
```

### 5. Update Initialize Script

Edit `backend/scripts/initialize.ts`:

Replace these lines:
```typescript
const sasCredential = new PublicKey("YOUR_SAS_CREDENTIAL_PDA_HERE");
const sasSchema = new PublicKey("YOUR_SAS_SCHEMA_PDA_HERE");
```

With the addresses from step 4.

### 6. Update Frontend Constants

Edit `src/lib/constants.ts`:

For devnet, update:
```typescript
devnet: {
  programId: 'YOUR_DEPLOYED_PROGRAM_ID',
  // ...
  sasCredential: 'YOUR_SAS_CREDENTIAL_ADDRESS',
  sasSchema: 'YOUR_SAS_SCHEMA_ADDRESS',
}
```

For mainnet, update the mainnet section similarly.

### 7. Run Initialize Script

```bash
cd backend
yarn initialize
```

This initializes the AtomID protocol config with:
- Minimum burn amount
- Rank thresholds
- Burn mint address
- SAS credential/schema addresses

### 8. Verify Deployment

Check the program is initialized:
```bash
solana account <PROGRAM_ID> --url devnet
```

### 9. Test the Frontend

The frontend should now be able to:
- Create AtomIDs with SAS attestations
- Upgrade AtomIDs with updated attestations
- Display SAS attestation info on profiles

## Important Notes

- **SAS Authority is a PDA**: The program derives it automatically using seeds `[b"sas_authority"]`
- **No separate authority signer needed**: The program signs attestation instructions using `invoke_signed`
- **Order matters**: Deploy → Setup SAS → Initialize
- **Keep addresses safe**: Save all PDAs and addresses for future reference

## Troubleshooting

### "Account required by instruction is missing"
- Make sure you ran the SAS setup script
- Verify the credential and schema addresses are correct
- Check that the program ID matches in all configs

### "Invalid SAS Authority"
- The SAS authority PDA is derived automatically
- Make sure you're using the latest IDL
- Verify the program was rebuilt after authority changes

### Initialize fails
- Ensure SAS credential and schema exist (run setup-sas first)
- Check you have enough SOL
- Verify the program ID in initialize.ts matches deployment
