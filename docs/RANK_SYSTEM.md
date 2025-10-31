# AtomID Rank System

## Overview

AtomID uses a rank-based reputation system where users earn higher ranks by burning more $ATOM tokens. Each rank represents a level of commitment and sacrifice to the protocol.

---

## 🏅 Rank Tiers (0-9)

| Rank | Minimum Burned | Name | Meaning |
|------|----------------|------|---------|
| **0** | 0 - 999 ATOM | **Initiate** | Beginning the journey of sacrifice |
| **1** | 1,000+ ATOM | **Believer** | First commitment to the protocol |
| **2** | 5,000+ ATOM | **Devotee** | Growing dedication through action |
| **3** | 10,000+ ATOM | **Guardian** | Protected by faith, defending the vision |
| **4** | 25,000+ ATOM | **Keeper** | Preserving and maintaining the protocol |
| **5** | 50,000+ ATOM | **Oracle** | Wisdom gained through sacrifice |
| **6** | 100,000+ ATOM | **Architect** | Building the future of identity |
| **7** | 250,000+ ATOM | **Sage** | Deep understanding of proof-of-sacrifice |
| **8** | 500,000+ ATOM | **Ascended** | Transcendent proof of commitment |
| **9** | 1,000,000+ ATOM | **Eternal** | Ultimate sacrifice, immortalized on-chain |

---

## 📈 Rank Progression

```
Initiate (0)
    ↓ Burn 1,000 ATOM
Believer (1)
    ↓ Burn 4,000 more ATOM
Devotee (2)
    ↓ Burn 5,000 more ATOM
Guardian (3)
    ↓ Burn 15,000 more ATOM
Keeper (4)
    ↓ Burn 25,000 more ATOM
Oracle (5)
    ↓ Burn 50,000 more ATOM
Architect (6)
    ↓ Burn 150,000 more ATOM
Sage (7)
    ↓ Burn 250,000 more ATOM
Ascended (8)
    ↓ Burn 500,000 more ATOM
Eternal (9)
```

---

## 🎯 Rank Benefits by Use Case

### DEX Integration
```typescript
// Trading pair access
Rank 0-2: Basic pairs only
Rank 3-4: Standard pairs + some premium
Rank 5+:   All pairs including exclusive pools

// Fee discounts
const discount = rank * 0.05; // 0-45% discount
```

### DAO Governance
```typescript
// Voting weight
const votingPower = 1 + (rank * 2); // 1-19 votes

// Proposal creation
Rank 0-2: Cannot create proposals
Rank 3-4: Can create proposals with co-signers
Rank 5+:   Can create proposals independently
```

### Marketplace
```typescript
// Seller badges
Rank 0-1: No badge
Rank 2-4: "Verified Seller"
Rank 5-6: "Trusted Seller"
Rank 7+:   "Elite Seller"

// Transaction limits
Rank 0-2: $1,000 daily limit
Rank 3-4: $10,000 daily limit
Rank 5+:   Unlimited
```

### Social dApps
```typescript
// Post permissions
Rank 0:   Read only
Rank 1-2: Can post, limited to 10/day
Rank 3+:   Unlimited posting

// Verification badge
Rank 3+: Blue checkmark (Guardian+)
Rank 6+: Gold checkmark (Architect+)
```

---

## 💡 Rank Philosophy

### Initiate (0)
*"The first step is awareness."*

New users who haven't yet burned tokens or have burned minimal amounts. They're exploring the protocol and considering their commitment.

### Believer (1)
*"Faith begins with action."*

Users who have made their first significant burn, demonstrating initial belief in proof-of-sacrifice identity.

### Devotee (2)
*"Dedication grows through repetition."*

Users deepening their commitment, showing consistent belief through continued burns.

### Guardian (3)
*"Protect what you believe in."*

Users who have proven significant commitment and now help protect and promote the protocol.

### Keeper (4)
*"Preservation requires sacrifice."*

Those who maintain and uphold the protocol's values through sustained commitment.

### Oracle (5)
*"Wisdom comes from sacrifice."*

Users who have gained deep understanding through substantial token burns, serving as guides.

### Architect (6)
*"Build the future you believe in."*

Elite users actively shaping the protocol's future through their extreme commitment.

### Sage (7)
*"Understanding transcends knowledge."*

Rare individuals with profound understanding earned through exceptional sacrifice.

### Ascended (8)
*"Transcend the ordinary."*

Nearly mythical status, representing commitment beyond normal comprehension.

### Eternal (9)
*"Immortalized in the chain forever."*

The ultimate rank, representing complete dedication. Names recorded in protocol history.

---

## 🔢 Rank Calculation

Ranks are calculated deterministically on-chain:

```typescript
// TypeScript example
export const RANK_NAMES = [
  'Initiate',    // 0
  'Believer',    // 1
  'Devotee',     // 2
  'Guardian',    // 3
  'Keeper',      // 4
  'Oracle',      // 5
  'Architect',   // 6
  'Sage',        // 7
  'Ascended',    // 8
  'Eternal',     // 9
];

export const RANK_THRESHOLDS = [
  1_000,      // Rank 1: Believer
  5_000,      // Rank 2: Devotee
  10_000,     // Rank 3: Guardian
  25_000,     // Rank 4: Keeper
  50_000,     // Rank 5: Oracle
  100_000,    // Rank 6: Architect
  250_000,    // Rank 7: Sage
  500_000,    // Rank 8: Ascended
  1_000_000,  // Rank 9: Eternal
];

function calculateRank(totalBurned: number): number {
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalBurned >= RANK_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 0; // Initiate
}

function getRankName(rank: number): string {
  return RANK_NAMES[rank] || 'Unknown';
}
```

```rust
// Rust implementation (on-chain)
fn calculate_rank(total_burned: u64, thresholds: &[u64]) -> u8 {
    for (i, &threshold) in thresholds.iter().enumerate().rev() {
        if total_burned >= threshold {
            return (i + 1) as u8;
        }
    }
    0
}
```

---

## 📊 Rank Distribution (Estimated)

Based on proof-of-sacrifice economics:

| Rank | Expected Distribution | Why |
|------|----------------------|-----|
| 0 (Initiate) | 40-50% | Many explore before committing |
| 1-2 (Believer/Devotee) | 30-35% | Initial believers |
| 3-4 (Guardian/Keeper) | 15-20% | Committed core |
| 5-6 (Oracle/Architect) | 5-8% | Elite believers |
| 7-8 (Sage/Ascended) | 1-2% | Exceptional few |
| 9 (Eternal) | <0.5% | Legendary status |

This creates a natural pyramid structure where higher ranks are progressively rarer.

---

## 🎨 Visual Representation

### Rank Progression Flow

```
       ⭐ Eternal (9) ⭐
            ↑
      🌟 Ascended (8) 🌟
            ↑
        💫 Sage (7) 💫
            ↑
      🏛️ Architect (6) 🏛️
            ↑
      🔮 Oracle (5) 🔮
            ↑
      🗝️ Keeper (4) 🗝️
            ↑
      🛡️ Guardian (3) 🛡️
            ↑
      🙏 Devotee (2) 🙏
            ↑
      ✨ Believer (1) ✨
            ↑
      🌱 Initiate (0) 🌱
```

---

## 🔐 Rank Verification

### On-Chain Verification

```typescript
// Read from AtomID account
const atomId = await program.account.atomId.fetch(atomIdPDA);
const rank = atomId.rank;
const rankName = RANK_NAMES[rank];
console.log(`User is ${rankName} (Rank ${rank})`);
```

### SAS Attestation Verification

```typescript
// Read from SAS attestation
const account = await connection.getAccountInfo(attestationPDA);
const rank = account.data[8]; // First byte after discriminator
const rankName = RANK_NAMES[rank];
console.log(`Verified rank: ${rankName}`);
```

---

## 🎯 Integration Examples

### Display Rank Badge

```typescript
function getRankBadge(rank: number): string {
  const badges = ['🌱', '✨', '🙏', '🛡️', '🗝️', '🔮', '🏛️', '💫', '🌟', '⭐'];
  return badges[rank] || '❓';
}

function displayRank(rank: number, totalBurned: number) {
  const name = RANK_NAMES[rank];
  const badge = getRankBadge(rank);

  return `${badge} ${name} (Rank ${rank}) - ${totalBurned.toLocaleString()} ATOM burned`;
}
```

### Rank-Based Access Control

```typescript
async function checkAccess(userPubkey: PublicKey, requiredRank: number): Promise<boolean> {
  const atomId = await getAtomId(userPubkey);
  return atomId && atomId.rank >= requiredRank;
}

// Usage
if (await checkAccess(user, 5)) { // Require Oracle+
  // Grant premium access
}
```

---

## 📚 Additional Resources

- **[Developer Guide](./DEVELOPER_GUIDE.md)** - Integration guide
- **[Quick Reference](./QUICK_REFERENCE.md)** - Code snippets
- **[Integration Examples](./INTEGRATION_EXAMPLES.md)** - Use cases

---

**Remember:** Ranks are earned through irreversible sacrifice. Each rank represents genuine commitment to the protocol's vision of proof-of-sacrifice identity.

🜂 **Burn, and ascend.**
