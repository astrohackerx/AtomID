# AtomID SDK Examples

Practical examples showing how to use the AtomID SDK in real applications.

## Quick Start

```bash
npm install atomid-sdk @solana/web3.js
npm install -D ts-node typescript
```

## Examples

### 1. Verify Wallet

Check if a wallet has an AtomID and display their rank.

```bash
npx ts-node examples/verify-wallet.ts <WALLET_ADDRESS>
```

**Example:**
```bash
npx ts-node examples/verify-wallet.ts 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

### 2. Gate Access

Check what features a wallet can access based on their rank.

```bash
npx ts-node examples/gate-example.ts <WALLET_ADDRESS>
```

Shows which features are locked/unlocked based on minimum rank requirements.

### 3. Leaderboard

Display the top AtomID believers.

```bash
npx ts-node examples/leaderboard.ts [LIMIT]
```

**Examples:**
```bash
npx ts-node examples/leaderboard.ts       # Top 10
npx ts-node examples/leaderboard.ts 25    # Top 25
```

### 4. NFT Discount Calculator

Calculate NFT mint price with rank-based discounts.

```bash
npx ts-node examples/nft-discount.ts <WALLET_ADDRESS>
```

Shows how much discount a user gets based on their rank (10% per rank, max 50%).

### 5. Basic Usage (Reference)

Full API examples showing all SDK methods:

```bash
npx ts-node examples/basic-usage.ts
```

### 6. React App (Reference)

React integration examples:

```tsx
// See examples/react-app.tsx for complete React examples
```

## Use Cases

### Tiered Access Control

```typescript
import { AtomIDClient } from "atomid-sdk";

const client = new AtomIDClient();
const hasVIPAccess = await client.hasMinimumRank(wallet, 7);

if (hasVIPAccess) {
  // Grant VIP features
}
```

### Dynamic Pricing

```typescript
const rank = await client.getRank(wallet);
const discount = Math.min(rank * 0.1, 0.5); // 10% per rank, max 50%
const price = basePrice * (1 - discount);
```

### Reputation System

```typescript
const result = await client.verify(wallet);
if (result.exists) {
  const { rank, totalBurned } = result.account;
  // Display reputation badge
}
```

### Batch Verification

```typescript
const wallets = [...]; // Array of PublicKeys
const results = await client.verifyBatch(wallets);
// Process all results at once
```

## API Reference

See the [main README](../README.md) for complete API documentation.

## Need Help?

- [Quick Start Guide](../QUICK_START.md)
- [Full Documentation](../README.md)
- [Publishing Guide](../PUBLISHING_GUIDE.md)
