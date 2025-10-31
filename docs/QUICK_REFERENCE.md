# AtomID Quick Reference Card

Essential information for developers integrating AtomID.

---

## 🔑 Mainnet Addresses

```typescript
// AtomID Program
const ATOMID_PROGRAM_ID = new PublicKey("rnc2fycemiEgj4YbMSuwKFpdV6nkJonojCXib3j2by6");

// $ATOM Token Mint
const ATOM_MINT = new PublicKey("6KeQaJXFHczWKjrcXdMGKP773JKQmMWDXy4446adpump");

// SAS Program
const SAS_PROGRAM_ID = new PublicKey("22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG");
```

**Explorer Links:**
- [AtomID Program](https://solscan.io/account/rnc2fycemiEgj4YbMSuwKFpdV6nkJonojCXib3j2by6)
- [$ATOM Token](https://solscan.io/token/6KeQaJXFHczWKjrcXdMGKP773JKQmMWDXy4446adpump)
- [SAS Program](https://solscan.io/account/22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG)

---

## 📦 Installation

```bash
# Core packages
npm install @coral-xyz/anchor @solana/web3.js @solana/spl-token

# For SAS integration
npm install sas-lib
```

---

## 🎯 Common PDAs

### AtomID PDA (per user)
```typescript
const [atomIdPDA, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("atomid"), userWallet.toBuffer()],
  ATOMID_PROGRAM_ID
);
```

### Config PDA (global)
```typescript
const [configPDA, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("atomid_config")],
  ATOMID_PROGRAM_ID
);
```

### SAS Authority PDA
```typescript
const [sasAuthorityPDA, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("sas_authority")],
  ATOMID_PROGRAM_ID
);
```

### SAS Attestation PDA (per user)
```typescript
const [attestationPDA, bump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("attestation"),
    credentialPDA.toBuffer(),
    schemaPDA.toBuffer(),
    userWallet.toBuffer(),
  ],
  SAS_PROGRAM_ID
);
```

---

## 🔍 Quick Checks

### Check if user has AtomID
```typescript
// Direct method
try {
  const atomId = await program.account.atomId.fetch(atomIdPDA);
  console.log("Has AtomID:", true);
} catch {
  console.log("Has AtomID:", false);
}

// SAS method
const account = await connection.getAccountInfo(attestationPDA);
const hasAtomId = account !== null;
```

### Get user's rank
```typescript
// Direct method
const atomId = await program.account.atomId.fetch(atomIdPDA);
const rank = atomId.rank;

// SAS method (read from attestation)
const account = await connection.getAccountInfo(attestationPDA);
const rank = account.data[8]; // First byte after discriminator
```

### Get total burned
```typescript
// Direct method
const atomId = await program.account.atomId.fetch(atomIdPDA);
const totalBurned = atomId.totalBurned.toNumber() / 1_000_000; // Convert to ATOM

// SAS method
const account = await connection.getAccountInfo(attestationPDA);
const totalBurned = Number(account.data.readBigUInt64LE(9)) / 1_000_000;
```

---

## 🔥 Creating AtomID

### Minimum Code
```typescript
import { BN } from "@coral-xyz/anchor";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";

const burnAmount = new BN(1000 * 1_000_000); // 1000 ATOM
const userTokenAccount = await getAssociatedTokenAddress(ATOM_MINT, userWallet);

// Fetch config to get SAS addresses
const config = await program.account.atomConfig.fetch(configPDA);

// Derive attestation PDA
const [attestationPDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("attestation"),
    config.sasCredential.toBuffer(),
    config.sasSchema.toBuffer(),
    userWallet.toBuffer(),
  ],
  SAS_PROGRAM_ID
);

// Create AtomID
const tx = await program.methods
  .createAtomid(burnAmount, "My AtomID")
  .accounts({
    atomId: atomIdPDA,
    atomConfig: configPDA,
    user: userWallet,
    userTokenAccount,
    atomMint: ATOM_MINT,
    sasAttestation: attestationPDA,
    sasCredential: config.sasCredential,
    sasSchema: config.sasSchema,
    sasAuthority: sasAuthorityPDA,
    sasProgram: SAS_PROGRAM_ID,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

console.log("Created:", `https://solscan.io/tx/${tx}`);
```

---

## 📊 Rank System

| Rank | Min Burned | Name |
|------|-----------|------|
| 0 | 0 - 999 | Initiate |
| 1 | 1,000+ | Believer |
| 2 | 5,000+ | Committed |
| 3 | 10,000+ | Devoted |
| 4 | 25,000+ | Faithful |
| 5 | 50,000+ | Dedicated |
| 6 | 100,000+ | Champion |
| 7 | 250,000+ | Legend |
| 8 | 500,000+ | Mythic |
| 9 | 1,000,000+ | Transcendent |
| 10 | 5,000,000+ | Eternal |

---

## 🎯 Access Control Patterns

### Require Minimum Rank
```typescript
async function requireRank(userPubkey: PublicKey, minRank: number): Promise<boolean> {
  const [attestationPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("attestation"),
      CREDENTIAL_PDA.toBuffer(),
      SCHEMA_PDA.toBuffer(),
      userPubkey.toBuffer(),
    ],
    SAS_PROGRAM_ID
  );

  const account = await connection.getAccountInfo(attestationPDA);
  if (!account) return false;

  const rank = account.data[8];
  return rank >= minRank;
}

// Usage
if (await requireRank(userWallet, 5)) {
  // Grant premium access
}
```

### Calculate Voting Weight
```typescript
async function getVotingWeight(userPubkey: PublicKey): Promise<number> {
  const [attestationPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("attestation"),
      CREDENTIAL_PDA.toBuffer(),
      SCHEMA_PDA.toBuffer(),
      userPubkey.toBuffer(),
    ],
    SAS_PROGRAM_ID
  );

  const account = await connection.getAccountInfo(attestationPDA);
  if (!account) return 1; // Base weight

  const rank = account.data[8];
  return 1 + rank * 2; // 1 + (rank * 2) voting power
}
```

### Dynamic Discount
```typescript
async function getDiscount(userPubkey: PublicKey): Promise<number> {
  const [attestationPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("attestation"),
      CREDENTIAL_PDA.toBuffer(),
      SCHEMA_PDA.toBuffer(),
      userPubkey.toBuffer(),
    ],
    SAS_PROGRAM_ID
  );

  const account = await connection.getAccountInfo(attestationPDA);
  if (!account) return 0;

  const rank = account.data[8];
  return Math.min(rank * 2, 20); // Max 20% discount
}
```

---

## 🔐 SAS Attestation Schema

**Layout:** `[0, 3, 3]` → `[U8, U64, U64]`

**Fields:**
1. `rank` (U8, 1 byte) - User's rank 0-10
2. `total_burned` (U64, 8 bytes) - Total ATOM burned in lamports
3. `created_at_slot` (U64, 8 bytes) - Creation slot

**Binary Format:**
```
Byte 0:       rank
Bytes 1-8:    total_burned (little-endian)
Bytes 9-16:   created_at_slot (little-endian)
```

**Parsing:**
```typescript
const data = accountInfo.data;
const DISCRIMINATOR_SIZE = 8; // Skip SAS discriminator

const rank = data[DISCRIMINATOR_SIZE];
const totalBurned = data.readBigUInt64LE(DISCRIMINATOR_SIZE + 1);
const createdAt = data.readBigUInt64LE(DISCRIMINATOR_SIZE + 9);
```

---

## ⚡ Performance Tips

1. **Cache attestations** - They don't change often
2. **Batch reads** - Use `getMultipleAccountsInfo()`
3. **Use SAS for verification** - More gas efficient than program calls
4. **WebSockets for updates** - Real-time rank changes
5. **Index data off-chain** - For leaderboards and analytics

---

## 🚨 Common Errors

### "Account does not exist"
- User doesn't have an AtomID
- Check with `hasAtomId()` first

### "Insufficient burn amount"
- Burn amount below minimum (1000 ATOM)
- Check config for current minimum

### "Invalid SAS credential"
- SAS addresses don't match config
- Fetch config to get correct addresses

### "Insufficient rank"
- User's rank below requirement
- Display clear message to user

---

## 📚 Documentation

- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Complete guide
- **[SAS_DEVELOPER_GUIDE.md](./SAS_DEVELOPER_GUIDE.md)** - SAS integration
- **[INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md)** - Code examples
- **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - All docs

---

## 🔗 Useful Links

- **Program Explorer:** https://solscan.io/account/rnc2fycemiEgj4YbMSuwKFpdV6nkJonojCXib3j2by6
- **SAS Docs:** https://attest.solana.com/docs
- **Anchor Docs:** https://www.anchor-lang.com/
- **Solana Web3.js:** https://solana-labs.github.io/solana-web3.js/

---

## 💬 Support

- **Discord:** [Join](https://discord.gg/atomid)
- **Twitter:** [@AtomIDProtocol](https://twitter.com/atomidprotocol)
- **GitHub:** [Issues](https://github.com/yourusername/atomid/issues)

---

**Print this page for quick reference while coding!**

🜂 **Burn, and you exist.**
