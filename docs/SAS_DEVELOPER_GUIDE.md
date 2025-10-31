# AtomID + Solana Attestation Service (SAS) Integration Guide

## Overview

This guide focuses specifically on integrating AtomID with the **Solana Attestation Service (SAS)** using the official `sas-lib` npm package. SAS enables permissionless, standardized identity verification across the Solana ecosystem.

Every AtomID automatically creates verifiable on-chain attestations that any Solana protocol can read and verify without directly calling the AtomID program.

---

## 🎯 Why SAS Integration?

### Benefits

1. **Permissionless Verification** - Any dApp can verify AtomID ranks without AtomID program integration
2. **Standardized Format** - Uses industry-standard attestation format recognized across Solana
3. **Gas Efficient** - Reading attestations costs less than calling the AtomID program
4. **Composable** - DEXs, DAOs, marketplaces, and social dApps can all read the same attestations
5. **Future-Proof** - As SAS adoption grows, your integration becomes more valuable

### How It Works

```
┌─────────────────┐
│  User burns     │
│  $ATOM tokens   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐       ┌──────────────────┐
│  AtomID Program │──────▶│  Creates SAS     │
│  creates AtomID │  CPI  │  Attestation     │
└─────────────────┘       └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │  SAS Program     │
                          │  stores on-chain │
                          │  attestation     │
                          └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │  Any dApp can    │
                          │  read & verify   │
                          │  attestation     │
                          └──────────────────┘
```

---

## 📦 Installation

### Using npm

```bash
npm install sas-lib @solana/web3.js
```

### Using yarn

```bash
yarn add sas-lib @solana/web3.js
```

---

## 🔑 Key Constants

```typescript
import { PublicKey } from "@solana/web3.js";

// SAS Program ID (Mainnet)
export const SAS_PROGRAM_ID = new PublicKey(
  "22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG"
);

// AtomID Program ID (Mainnet)
export const ATOMID_PROGRAM_ID = new PublicKey(
  "rnc2fycemiEgj4YbMSuwKFpdV6nkJonojCXib3j2by6"
);

// AtomID SAS Credential (verify on-chain)
// This credential was created during AtomID deployment
export const ATOMID_CREDENTIAL = new PublicKey(
  "YOUR_CREDENTIAL_PDA" // Replace with actual mainnet credential
);

// AtomID SAS Schema (verify on-chain)
export const ATOMID_SCHEMA = new PublicKey(
  "YOUR_SCHEMA_PDA" // Replace with actual mainnet schema
);
```

**Important**: The actual credential and schema PDAs are deterministically derived. To find them:

```typescript
// Derive SAS Authority (owned by AtomID program)
const [sasAuthority] = PublicKey.findProgramAddressSync(
  [Buffer.from("sas_authority")],
  ATOMID_PROGRAM_ID
);

// Derive Credential PDA
const credentialName = "AtomID_v1";
const [credentialPDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("credential"),
    sasAuthority.toBuffer(),
    Buffer.from(credentialName),
  ],
  SAS_PROGRAM_ID
);

// Derive Schema PDA
const schemaName = "atomid_rank_v1";
const schemaVersion = 1;
const [schemaPDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("schema"),
    credentialPDA.toBuffer(),
    Buffer.from(schemaName),
    Buffer.from([schemaVersion]),
  ],
  SAS_PROGRAM_ID
);
```

---

## 📐 AtomID Attestation Schema

AtomID attestations follow this standardized schema:

### Schema Definition

| Field | Type | Description |
|-------|------|-------------|
| `rank` | U8 | User's rank (0-10) based on total burned |
| `total_burned` | U64 | Total $ATOM burned in lamports |
| `created_at_slot` | U64 | Slot when AtomID was created |

### Layout Array

```typescript
const ATOMID_SCHEMA_LAYOUT = [0, 3, 3];
// 0 = U8 (rank)
// 3 = U64 (total_burned)
// 3 = U64 (created_at_slot)
```

### Field Names

```typescript
const ATOMID_SCHEMA_FIELDS = ["rank", "total_burned", "created_at_slot"];
```

### Binary Format

```
Byte 0:       rank (U8, 1 byte)
Bytes 1-8:    total_burned (U64, 8 bytes, little-endian)
Bytes 9-16:   created_at_slot (U64, 8 bytes, little-endian)

Total: 17 bytes
```

---

## 🔍 Reading AtomID Attestations

### 1. Basic Setup

```typescript
import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection(
  "https://api.mainnet-beta.solana.com",
  "confirmed"
);
```

### 2. Derive Attestation PDA

Each user's attestation is stored at a deterministic address:

```typescript
/**
 * Derives the SAS attestation PDA for a user's AtomID
 * @param userPubkey - The wallet public key of the user
 * @returns The attestation PDA and bump seed
 */
function deriveAttestationPDA(userPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("attestation"),
      ATOMID_CREDENTIAL.toBuffer(),
      ATOMID_SCHEMA.toBuffer(),
      userPubkey.toBuffer(), // Nonce = user's public key
    ],
    SAS_PROGRAM_ID
  );
}
```

### 3. Check if Attestation Exists

```typescript
/**
 * Checks if a user has an AtomID attestation
 * @param connection - Solana connection
 * @param userPubkey - User's wallet public key
 * @returns True if attestation exists
 */
async function hasAtomIdAttestation(
  connection: Connection,
  userPubkey: PublicKey
): Promise<boolean> {
  const [attestationPDA] = deriveAttestationPDA(userPubkey);

  try {
    const accountInfo = await connection.getAccountInfo(attestationPDA);
    return accountInfo !== null && accountInfo.owner.equals(SAS_PROGRAM_ID);
  } catch (error) {
    console.error("Error checking attestation:", error);
    return false;
  }
}

// Example usage
const hasAtomId = await hasAtomIdAttestation(connection, userWallet);
if (hasAtomId) {
  console.log("✅ User has an AtomID");
} else {
  console.log("❌ User does not have an AtomID");
}
```

### 4. Read Attestation Data

```typescript
interface AtomIdAttestation {
  rank: number;
  totalBurned: bigint;
  totalBurnedAtom: number; // Converted to ATOM
  createdAtSlot: bigint;
}

/**
 * Reads and parses an AtomID attestation
 * @param connection - Solana connection
 * @param userPubkey - User's wallet public key
 * @returns Parsed attestation data or null if not found
 */
async function readAtomIdAttestation(
  connection: Connection,
  userPubkey: PublicKey
): Promise<AtomIdAttestation | null> {
  const [attestationPDA] = deriveAttestationPDA(userPubkey);

  const accountInfo = await connection.getAccountInfo(attestationPDA);
  if (!accountInfo) {
    return null;
  }

  // Verify owner
  if (!accountInfo.owner.equals(SAS_PROGRAM_ID)) {
    throw new Error("Invalid attestation owner");
  }

  const data = accountInfo.data;

  // Parse based on SAS account layout
  // Note: Adjust offsets based on actual SAS account structure
  // This assumes the attestation data starts after an 8-byte discriminator

  const DISCRIMINATOR_SIZE = 8;
  const dataStart = DISCRIMINATOR_SIZE;

  // Read rank (1 byte, U8)
  const rank = data[dataStart];

  // Read total_burned (8 bytes, U64, little-endian)
  const totalBurned = data.readBigUInt64LE(dataStart + 1);

  // Read created_at_slot (8 bytes, U64, little-endian)
  const createdAtSlot = data.readBigUInt64LE(dataStart + 9);

  return {
    rank,
    totalBurned,
    totalBurnedAtom: Number(totalBurned) / 1_000_000, // Convert to ATOM
    createdAtSlot,
  };
}

// Example usage
const attestation = await readAtomIdAttestation(connection, userWallet);
if (attestation) {
  console.log("Rank:", attestation.rank);
  console.log("Total Burned:", attestation.totalBurnedAtom, "ATOM");
  console.log("Created at Slot:", attestation.createdAtSlot.toString());
} else {
  console.log("No attestation found");
}
```

### 5. Batch Read Multiple Attestations

For efficiency, read multiple attestations in one call:

```typescript
/**
 * Batch reads multiple AtomID attestations
 * @param connection - Solana connection
 * @param userPubkeys - Array of user public keys
 * @returns Map of pubkey to attestation data
 */
async function batchReadAttestations(
  connection: Connection,
  userPubkeys: PublicKey[]
): Promise<Map<string, AtomIdAttestation | null>> {
  // Derive all PDAs
  const pdas = userPubkeys.map((pk) => deriveAttestationPDA(pk)[0]);

  // Fetch all accounts in one call
  const accounts = await connection.getMultipleAccountsInfo(pdas);

  // Parse results
  const results = new Map<string, AtomIdAttestation | null>();

  accounts.forEach((account, index) => {
    const userKey = userPubkeys[index].toString();

    if (!account) {
      results.set(userKey, null);
      return;
    }

    const data = account.data;
    const DISCRIMINATOR_SIZE = 8;
    const dataStart = DISCRIMINATOR_SIZE;

    const rank = data[dataStart];
    const totalBurned = data.readBigUInt64LE(dataStart + 1);
    const createdAtSlot = data.readBigUInt64LE(dataStart + 9);

    results.set(userKey, {
      rank,
      totalBurned,
      totalBurnedAtom: Number(totalBurned) / 1_000_000,
      createdAtSlot,
    });
  });

  return results;
}

// Example: Read attestations for 100 users
const users = [...]; // Array of PublicKeys
const attestations = await batchReadAttestations(connection, users);

users.forEach((user) => {
  const attestation = attestations.get(user.toString());
  if (attestation) {
    console.log(`${user}: Rank ${attestation.rank}`);
  }
});
```

---

## 🎯 Use Case Examples

### 1. Access Control - Minimum Rank Gate

```typescript
/**
 * Checks if user meets minimum rank requirement
 */
async function meetsMinimumRank(
  connection: Connection,
  userPubkey: PublicKey,
  minRank: number
): Promise<boolean> {
  const attestation = await readAtomIdAttestation(connection, userPubkey);

  if (!attestation) {
    return false; // No AtomID
  }

  return attestation.rank >= minRank;
}

// Example: Premium feature gate
async function canAccessPremiumFeatures(
  connection: Connection,
  userPubkey: PublicKey
): Promise<boolean> {
  return await meetsMinimumRank(connection, userPubkey, 5);
}

// Usage in your app
if (await canAccessPremiumFeatures(connection, userWallet)) {
  // Show premium features
  console.log("✅ Premium access granted");
} else {
  console.log("❌ Upgrade to Rank 5 for premium access");
}
```

### 2. DAO Voting Weight by Rank

```typescript
/**
 * Calculates voting weight based on AtomID rank
 * Higher rank = more voting power
 */
async function calculateVotingWeight(
  connection: Connection,
  userPubkey: PublicKey
): Promise<number> {
  const attestation = await readAtomIdAttestation(connection, userPubkey);

  if (!attestation) {
    return 1; // Base voting weight for non-AtomID holders
  }

  // Example formula: 1 + (rank * 2)
  // Rank 0 = 1 vote
  // Rank 5 = 11 votes
  // Rank 10 = 21 votes
  return 1 + attestation.rank * 2;
}

// Example: Governance proposal
interface ProposalVote {
  voter: PublicKey;
  choice: "yes" | "no";
  weight: number;
}

async function castWeightedVote(
  connection: Connection,
  proposalId: string,
  voter: PublicKey,
  choice: "yes" | "no"
): Promise<ProposalVote> {
  const weight = await calculateVotingWeight(connection, voter);

  const vote: ProposalVote = {
    voter,
    choice,
    weight,
  };

  console.log(`Vote cast with weight: ${weight}`);
  return vote;
}
```

### 3. Dynamic Pricing Based on Rank

```typescript
/**
 * Calculates discount percentage based on AtomID rank
 */
async function getDiscount(
  connection: Connection,
  userPubkey: PublicKey
): Promise<number> {
  const attestation = await readAtomIdAttestation(connection, userPubkey);

  if (!attestation) {
    return 0; // No discount without AtomID
  }

  // 2% discount per rank level
  return Math.min(attestation.rank * 2, 20); // Max 20% discount
}

// Example: Marketplace pricing
async function calculatePrice(
  connection: Connection,
  basePrice: number,
  buyer: PublicKey
): Promise<number> {
  const discountPercent = await getDiscount(connection, buyer);
  const discount = (basePrice * discountPercent) / 100;
  const finalPrice = basePrice - discount;

  console.log(`Base Price: ${basePrice}`);
  console.log(`Discount: ${discountPercent}% (-${discount})`);
  console.log(`Final Price: ${finalPrice}`);

  return finalPrice;
}
```

### 4. Reputation-Based Airdrop

```typescript
/**
 * Calculates airdrop allocation based on commitment (total burned)
 */
async function calculateAirdropAmount(
  connection: Connection,
  userPubkey: PublicKey,
  totalAirdropPool: number
): Promise<number> {
  const attestation = await readAtomIdAttestation(connection, userPubkey);

  if (!attestation) {
    return 0; // No airdrop without AtomID
  }

  // Base allocation by rank
  const baseAllocation = attestation.rank * 100;

  // Bonus allocation based on total burned
  // 10% of burned amount (in ATOM) as bonus tokens
  const bonusAllocation = attestation.totalBurnedAtom * 0.1;

  return baseAllocation + bonusAllocation;
}

// Example: Process airdrop for multiple users
async function processAirdrop(
  connection: Connection,
  users: PublicKey[],
  totalTokens: number
): Promise<Map<string, number>> {
  const allocations = new Map<string, number>();

  for (const user of users) {
    const amount = await calculateAirdropAmount(connection, user, totalTokens);
    allocations.set(user.toString(), amount);
  }

  return allocations;
}
```

### 5. Social dApp - Bot Filter

```typescript
/**
 * Verifies user is human with minimum commitment
 */
async function isVerifiedHuman(
  connection: Connection,
  userPubkey: PublicKey,
  minBurnedAtom: number = 1000
): Promise<boolean> {
  const attestation = await readAtomIdAttestation(connection, userPubkey);

  if (!attestation) {
    return false;
  }

  // Require minimum burn amount to prove humanity
  return attestation.totalBurnedAtom >= minBurnedAtom;
}

// Example: Post creation filter
async function canCreatePost(
  connection: Connection,
  userPubkey: PublicKey
): Promise<{ allowed: boolean; reason?: string }> {
  if (!(await isVerifiedHuman(connection, userPubkey))) {
    return {
      allowed: false,
      reason: "Create an AtomID with at least 1000 ATOM burned to post",
    };
  }

  return { allowed: true };
}
```

### 6. Leaderboard by Commitment

```typescript
/**
 * Creates a leaderboard sorted by total burned
 */
async function createLeaderboard(
  connection: Connection,
  userPubkeys: PublicKey[]
): Promise<Array<{ user: string; rank: number; totalBurned: number }>> {
  const attestations = await batchReadAttestations(connection, userPubkeys);

  const leaderboard = Array.from(attestations.entries())
    .filter(([_, attestation]) => attestation !== null)
    .map(([user, attestation]) => ({
      user,
      rank: attestation!.rank,
      totalBurned: attestation!.totalBurnedAtom,
    }))
    .sort((a, b) => b.totalBurned - a.totalBurned); // Sort by total burned

  return leaderboard;
}

// Example usage
const topUsers = [...]; // Array of PublicKeys
const leaderboard = await createLeaderboard(connection, topUsers);

console.log("🏆 Top Committed Users:");
leaderboard.slice(0, 10).forEach((entry, index) => {
  console.log(
    `${index + 1}. ${entry.user} - Rank ${entry.rank} - ${entry.totalBurned.toLocaleString()} ATOM`
  );
});
```

---

## 🔧 Advanced Patterns

### Caching Strategy

For high-traffic applications, implement caching:

```typescript
class AtomIdAttestationCache {
  private cache = new Map<string, { data: AtomIdAttestation | null; timestamp: number }>();
  private TTL = 60_000; // 1 minute cache

  async get(
    connection: Connection,
    userPubkey: PublicKey
  ): Promise<AtomIdAttestation | null> {
    const key = userPubkey.toString();
    const cached = this.cache.get(key);

    // Return cached if still valid
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }

    // Fetch fresh data
    const data = await readAtomIdAttestation(connection, userPubkey);
    this.cache.set(key, { data, timestamp: Date.now() });

    return data;
  }

  invalidate(userPubkey: PublicKey) {
    this.cache.delete(userPubkey.toString());
  }

  clear() {
    this.cache.clear();
  }
}

// Usage
const cache = new AtomIdAttestationCache();
const attestation = await cache.get(connection, userWallet);
```

### Real-Time Updates with WebSockets

Monitor attestation changes in real-time:

```typescript
/**
 * Subscribes to attestation account changes
 */
function subscribeToAttestation(
  connection: Connection,
  userPubkey: PublicKey,
  callback: (attestation: AtomIdAttestation | null) => void
): number {
  const [attestationPDA] = deriveAttestationPDA(userPubkey);

  const subscriptionId = connection.onAccountChange(
    attestationPDA,
    (accountInfo) => {
      if (!accountInfo) {
        callback(null);
        return;
      }

      // Parse updated data
      const data = accountInfo.data;
      const DISCRIMINATOR_SIZE = 8;
      const dataStart = DISCRIMINATOR_SIZE;

      const rank = data[dataStart];
      const totalBurned = data.readBigUInt64LE(dataStart + 1);
      const createdAtSlot = data.readBigUInt64LE(dataStart + 9);

      callback({
        rank,
        totalBurned,
        totalBurnedAtom: Number(totalBurned) / 1_000_000,
        createdAtSlot,
      });
    },
    "confirmed"
  );

  return subscriptionId;
}

// Usage
const subId = subscribeToAttestation(connection, userWallet, (attestation) => {
  if (attestation) {
    console.log("Attestation updated! New rank:", attestation.rank);
  }
});

// Cleanup
// connection.removeAccountChangeListener(subId);
```

---

## ⚠️ Important Notes

### 1. Attestation Lifecycle

- **Created**: When user calls `create_atomid()`
- **Updated**: When user calls `upgrade_atomid()` (old attestation closed, new one created)
- **Permanent**: Attestations are permanent unless explicitly closed during upgrades

### 2. Nonce Strategy

AtomID uses the user's public key as the nonce for attestation derivation. This means:
- Each user can have ONE active attestation at a time
- Upgrades close the old attestation and create a new one
- The attestation PDA remains consistent unless upgraded

### 3. Expiry

AtomID attestations have a 1-year expiry by default (365 days from creation):

```rust
let expiry_timestamp = Clock::get()?.unix_timestamp + (365 * 24 * 60 * 60);
```

After expiry, attestations should be considered invalid. Implement expiry checking:

```typescript
async function isAttestationValid(
  connection: Connection,
  userPubkey: PublicKey
): Promise<boolean> {
  const attestation = await readAtomIdAttestation(connection, userPubkey);
  if (!attestation) return false;

  // Check if created more than 1 year ago
  const currentSlot = await connection.getSlot();
  const slotsPerYear = 365 * 24 * 60 * 60 * 2; // Approximately 2 slots/second

  return currentSlot - Number(attestation.createdAtSlot) < slotsPerYear;
}
```

### 4. Error Handling

Always handle potential errors:

```typescript
async function safeReadAttestation(
  connection: Connection,
  userPubkey: PublicKey
): Promise<AtomIdAttestation | null> {
  try {
    return await readAtomIdAttestation(connection, userPubkey);
  } catch (error) {
    console.error("Error reading attestation:", error);
    return null;
  }
}
```

---

## 🧪 Testing

### Mainnet Testing Checklist

- [ ] Verify SAS Program ID is correct
- [ ] Confirm credential and schema PDAs match deployed values
- [ ] Test with wallets that have AtomIDs
- [ ] Test with wallets without AtomIDs
- [ ] Verify attestation data parsing is correct
- [ ] Test batch reads for performance
- [ ] Implement proper error handling
- [ ] Cache attestation data appropriately
- [ ] Monitor RPC costs and optimize calls

---

## 📊 Performance Tips

1. **Batch Reads**: Use `getMultipleAccountsInfo()` for multiple users
2. **Cache Aggressively**: Attestations don't change often
3. **Use Websockets**: For real-time updates instead of polling
4. **Optimize RPC Calls**: Minimize unnecessary account fetches
5. **Parallel Requests**: Process independent requests concurrently

---

## 🔗 Resources

- **SAS Documentation**: https://attest.solana.com/docs
- **SAS GitHub**: https://github.com/solana-foundation/solana-attestation-service
- **AtomID Program**: [View on Solscan](https://solscan.io/account/rnc2fycemiEgj4YbMSuwKFpdV6nkJonojCXib3j2by6)
- **SAS Program**: [View on Solscan](https://solscan.io/account/22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG)

---

## 🤝 Support

Need help with SAS integration?

- **Discord**: [Join Community](https://discord.gg/atomid)
- **GitHub Issues**: [Report bugs](https://github.com/yourusername/atomid/issues)
- **Twitter**: [@AtomIDProtocol](https://twitter.com/atomidprotocol)

---

**Built for composability. Verified by SAS. Powered by Solana.**

🜂 *Integrate once, verify everywhere.*
