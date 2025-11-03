# atomid-sdk

**Official SDK for integrating AtomID 🜂 verification in your Solana dApp**

Verify proof-of-sacrifice ranks and gate access based on user commitment. Perfect for creating tiered features, exclusive content, or reputation-based systems.

## Installation

```bash
npm install atomid-sdk @solana/web3.js
```

## Quick Start

### Basic Usage

```typescript
import { AtomIDClient } from "atomid-sdk";
import { PublicKey } from "@solana/web3.js";

// Initialize client
const client = new AtomIDClient();

// Verify a wallet's AtomID
const wallet = new PublicKey("...");
const result = await client.verify(wallet);

if (result.exists && result.account) {
  console.log(`Rank: ${result.account.rank}`);
  console.log(`Total Burned: ${result.account.totalBurned}`);
}
```

### Gate Access by Rank

```typescript
import { AtomIDClient } from "atomid-sdk";

const client = new AtomIDClient();

// Check if user has minimum rank
const hasAccess = await client.hasMinimumRank(wallet, 5); // Requires Oracle rank

if (hasAccess) {
  // Grant access to premium feature
} else {
  // Show upgrade prompt
}
```

### React Integration

```tsx
import { AtomIDProvider, useAtomIDRank, AtomIDGate } from "atomid-sdk/react";
import { useWallet } from "@solana/wallet-adapter-react";

function App() {
  return (
    <AtomIDProvider>
      <YourApp />
    </AtomIDProvider>
  );
}

function UserProfile() {
  const { publicKey } = useWallet();
  const { rank, rankName, rankEmoji } = useAtomIDRank(publicKey);

  return (
    <div>
      {rankEmoji} {rankName} (Rank {rank})
    </div>
  );
}

function PremiumFeature() {
  const { publicKey } = useWallet();

  return (
    <AtomIDGate
      wallet={publicKey}
      minRank={5}
      fallback={<div>Requires Oracle rank or higher</div>}
    >
      <div>Premium content here!</div>
    </AtomIDGate>
  );
}
```

## Core Features

### AtomIDClient

Main client for verifying AtomID accounts.

```typescript
const client = new AtomIDClient({
  rpcUrl: "https://api.mainnet-beta.solana.com", // Optional
  programId: "rnc2fycemiEgj4YbMSuwKFpdV6nkJonojCXib3j2by6", // Optional
  cacheTTL: 300000 // 5 minutes (optional)
});
```

#### Methods

**verify(wallet)** - Get complete AtomID account data
```typescript
const result = await client.verify(wallet);
// Returns: { exists: boolean, account: AtomIDAccount | null, error?: string }
```

**getRank(wallet)** - Get just the rank (0-9)
```typescript
const rank = await client.getRank(wallet);
// Returns: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
```

**hasMinimumRank(wallet, minRank)** - Check if meets requirement
```typescript
const hasRank = await client.hasMinimumRank(wallet, 5);
// Returns: boolean
```

**checkRequirement(wallet, requirement)** - Check rank range
```typescript
const meetsRequirement = await client.checkRequirement(wallet, {
  minRank: 5,
  maxRank: 7 // Optional
});
```

**verifyBatch(wallets)** - Verify multiple wallets at once
```typescript
const results = await client.verifyBatch([wallet1, wallet2, wallet3]);
```

**getLeaderboard(limit)** - Get top ranked users
```typescript
const top100 = await client.getLeaderboard(100);
```

### Utility Functions

```typescript
import {
  getRankName,
  getRankEmoji,
  getRankThreshold,
  calculateRankFromBurned,
  getNextRankRequirement,
  getProgressToNextRank,
  formatAtomAmount,
  shortenAddress
} from "atomid-sdk";

// Get rank name
getRankName(5); // "Oracle"

// Get rank emoji
getRankEmoji(9); // "♾️"

// Calculate rank from burned amount
calculateRankFromBurned(BigInt(100000)); // 6 (Architect)

// Get next rank requirement
getNextRankRequirement(5);
// { nextRank: 6, atomsRequired: 100000n }

// Get progress to next rank
getProgressToNextRank(BigInt(75000), 5);
// { percentage: 50, atomsNeeded: 25000n, nextRank: 6 }

// Format numbers
formatAtomAmount(BigInt(1000000)); // "1,000,000"
shortenAddress("7xKXtg...8yGHZ9w"); // "7xKX...Z9w"
```

### React Hooks

**useAtomID()** - Get the client instance
```tsx
const client = useAtomID();
```

**useAtomIDAccount(wallet)** - Get full account data
```tsx
const { account, loading, error } = useAtomIDAccount(publicKey);
```

**useAtomIDRank(wallet)** - Get rank information
```tsx
const { rank, rankName, rankEmoji, totalBurned, loading } = useAtomIDRank(publicKey);
```

**useAtomIDGate(wallet, minRank)** - Gate access
```tsx
const { hasAccess, currentRank, requiredRank, loading } = useAtomIDGate(publicKey, 5);
```

**useRankProgress(wallet)** - Track progress
```tsx
const { percentage, atomsNeeded, nextRank, loading } = useRankProgress(publicKey);
```

### React Components

**AtomIDGate** - Conditionally render content
```tsx
<AtomIDGate
  wallet={publicKey}
  minRank={5}
  fallback={<UpgradePrompt />}
>
  <PremiumContent />
</AtomIDGate>
```

**RankBadge** - Display rank badge
```tsx
<RankBadge wallet={publicKey} showName showEmoji />
```

**RankProgressBar** - Show progress to next rank
```tsx
<RankProgressBar wallet={publicKey} />
```

## Use Cases

### 1. Tiered Access Control

```typescript
import { AtomIDClient } from "atomid-sdk";

const client = new AtomIDClient();

// NFT minting with rank discounts
const rank = await client.getRank(wallet);
const price = BASE_PRICE * (1 - rank * 0.1); // 10% off per rank

// Early access for high ranks
if (rank >= 7) {
  allowEarlyAccess();
}
```

### 2. DAO Voting Weight

```typescript
// Vote weight based on commitment
const result = await client.verify(wallet);
if (result.account) {
  const votingPower = 1 + result.account.rank * 2;
  recordVote(wallet, votingPower);
}
```

### 3. Fee Discounts

```typescript
// Trading fee discounts
const rank = await client.getRank(wallet);
const feeMultiplier = Math.max(0.1, 1 - rank * 0.1);
const fee = baseFee * feeMultiplier;
```

### 4. Exclusive Communities

```typescript
// Gated Discord/chat access
const hasAccess = await client.hasMinimumRank(wallet, 5);
if (hasAccess) {
  grantDiscordRole("Oracle+");
}
```

### 5. Reputation Systems

```typescript
// User credibility score
const { account } = await client.verify(wallet);
const credibilityScore = account
  ? account.rank * 10 + Number(account.totalBurned) / 1000
  : 0;
```

## Rank System

| Rank | Name | ATOM Burned | Emoji |
|------|------|-------------|-------|
| 0 | Initiate | 0 | 🌱 |
| 1 | Believer | 1,000 | ✨ |
| 2 | Devotee | 5,000 | 🔥 |
| 3 | Guardian | 10,000 | 🛡️ |
| 4 | Keeper | 25,000 | 🔑 |
| 5 | Oracle | 50,000 | 🔮 |
| 6 | Architect | 100,000 | 🏛️ |
| 7 | Sage | 250,000 | 🧙 |
| 8 | Ascended | 500,000 | 👑 |
| 9 | Eternal | 1,000,000 | ♾️ |

## Advanced Usage

### Custom Gate Function

```typescript
import { createAtomIDGate } from "atomid-sdk";

const gate = createAtomIDGate(client, {
  requirement: { minRank: 5 },
  onSuccess: () => console.log("Access granted!"),
  onFailure: (rank) => console.log(`Insufficient rank: ${rank}`)
});

const canAccess = await gate(wallet);
```

### Programmatic Gating

```typescript
import { gateByRank } from "atomid-sdk";

// Wrap any async function
const result = await gateByRank(
  client,
  wallet,
  5,
  async () => {
    // This only runs if rank >= 5
    return await performPremiumAction();
  }
);
```

### Cache Management

```typescript
// Clear cache manually
client.clearCache();

// Custom cache TTL
const client = new AtomIDClient({
  cacheTTL: 60000 // 1 minute
});
```

## TypeScript Support

Fully typed with TypeScript. All types are exported:

```typescript
import type {
  AtomIDAccount,
  AtomIDRank,
  VerificationResult,
  RankRequirement,
  AtomIDConfig
} from "atomid-sdk";
```

## Performance

- **Caching**: 5-minute default cache (configurable)
- **Batch Verification**: Verify multiple wallets in parallel
- **Lightweight**: Minimal dependencies
- **Efficient**: Reuses RPC connections

## Error Handling

```typescript
try {
  const result = await client.verify(wallet);

  if (!result.exists) {
    console.log("User has no AtomID");
  }

  if (result.error) {
    console.error("Verification error:", result.error);
  }
} catch (error) {
  console.error("SDK error:", error);
}
```

## Examples

Check out complete examples in the `/examples` directory:
- Basic verification
- React app integration
- NFT minting with discounts
- DAO voting system
- Gated content

## Support

- **Issues**: [GitHub Issues](https://github.com/astrohackerx/AtomID)
- **Docs**: [Full Documentation](https://github.com/astrohackerx/AtomID)
- **Twitter**: [@lostbtclayer](https://x.com/lostbtclayer)

## License

MIT

---

**Built for the Lost Bitcoin Layer ecosystem** 🜂
