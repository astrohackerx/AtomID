# 🜂 Lost Bitcoin Layer [ATOM] Protocol

[![Solana](https://img.shields.io/badge/Solana-Mainnet-9945FF?logo=solana)](https://solana.com)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Anchor](https://img.shields.io/badge/Anchor-0.31.1-coral)](https://www.anchor-lang.com/)
[![SAS](https://img.shields.io/badge/SAS-Integrated-green)](https://attest.solana.com)

**Proof-of-Sacrifice Identity Protocol on Solana**

> *"Burn, and you exist."*

AtomID is a decentralized identity protocol where users create soulbound identities by burning $ATOM tokens. Each burn creates permanent, verifiable on-chain proof of commitment through irreversible sacrifice.

---

## 🌟 What is AtomID?

AtomID revives Satoshi's original vision hidden in early Bitcoin code: **identity must be earned through sacrifice, not purchased or granted.**

### Key Features

- 🔥 **Proof of Sacrifice** - Create identity by burning $ATOM tokens
- 🔒 **Soulbound** - Non-transferable, permanently linked to your wallet
- 📊 **Rank-Based** - Higher burns = higher ranks (0-10)
- ✅ **SAS Integrated** - Verifiable via Solana Attestation Service
- 🌐 **Permissionless** - Any dApp can verify identities
- ♾️ **Permanent** - Stored forever on Solana blockchain

---

## 📋 Mainnet Deployment

| Resource | Address | Explorer |
|----------|---------|----------|
| **AtomID Program** | `rnc2fycemiEgj4YbMSuwKFpdV6nkJonojCXib3j2by6` | [View on Solscan →](https://solscan.io/account/rnc2fycemiEgj4YbMSuwKFpdV6nkJonojCXib3j2by6) |
| **$ATOM Token** | `6KeQaJXFHczWKjrcXdMGKP773JKQmMWDXy4446adpump` | [View on Solscan →](https://solscan.io/token/6KeQaJXFHczWKjrcXdMGKP773JKQmMWDXy4446adpump) |
| **SAS Program** | `22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG` | [View on Solscan →](https://solscan.io/account/22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG) |

**Status:** ✅ Live on Solana Mainnet | Fully Verified

---

## 🚀 Quick Start

### For Developers

```bash
# Install dependencies
npm install @coral-xyz/anchor @solana/web3.js @solana/spl-token

# For SAS integration
npm install sas-lib
```

### Basic Example

```typescript
import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";

const ATOMID_PROGRAM_ID = new PublicKey("rnc2fycemiEgj4YbMSuwKFpdV6nkJonojCXib3j2by6");

// Check if user has AtomID
const [atomIdPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("atomid"), userWallet.toBuffer()],
  ATOMID_PROGRAM_ID
);

const atomId = await program.account.atomId.fetch(atomIdPDA);
console.log("Rank:", atomId.rank);
console.log("Burned:", atomId.totalBurned.toNumber() / 1_000_000, "ATOM");
```

**[See Complete Examples →](./docs/INTEGRATION_EXAMPLES.md)**

---

## 📚 Documentation

### 🎯 Start Here

| Document | Description | Best For |
|----------|-------------|----------|
| **[Quick Reference](./docs/QUICK_REFERENCE.md)** | One-page cheat sheet with code snippets | Quick integration |
| **[Developer Guide](./docs/DEVELOPER_GUIDE.md)** | Complete integration guide | Full implementation |
| **[Integration Examples](./docs/INTEGRATION_EXAMPLES.md)** | Production-ready code | Copy-paste solutions |

### 🔐 SAS Integration

| Document | Description |
|----------|-------------|
| **[SAS Developer Guide](./docs/SAS_DEVELOPER_GUIDE.md)** | Complete SAS integration with `sas-lib` |
| **[SAS Integration Overview](./docs/SAS_INTEGRATION.md)** | Technical overview of SAS implementation |

### 📖 Learn More

| Document | Description |
|----------|-------------|
| **[Whitepaper](./whitepaper.md)** | Technical architecture and design |
| **[Security](./SECURITY.md)** | Security policy and best practices |
| **[Documentation Index](./docs/DOCUMENTATION_INDEX.md)** | Complete documentation navigation |

---

## 🔥 Rank System

| Rank | Minimum Burned | Name | Description |
|------|----------------|------|-------------|
| 0 | 0 - 999 | Initiate | Starting level |
| 1 | 1,000+ | Believer | First commitment |
| 2 | 5,000+ | Committed | Growing dedication |
| 3 | 10,000+ | Devoted | Strong conviction |
| 4 | 25,000+ | Faithful | Deep commitment |
| 5 | 50,000+ | Dedicated | Serious believer |
| 6 | 100,000+ | Champion | Elite status |
| 7 | 250,000+ | Legend | Exceptional proof |
| 8 | 500,000+ | Mythic | Extraordinary |
| 9 | 1,000,000+ | Transcendent | Nearly eternal |
| 10 | 5,000,000+ | Eternal | Ultimate sacrifice |

---

## 🎯 Use Cases

### DEX Integration
```typescript
// Gate premium trading pairs by rank
const canTrade = attestation && attestation.rank >= 5;
```

### DAO Governance
```typescript
// Weight votes by proof of sacrifice
const votingPower = 1 + attestation.rank * 2;
```

### Marketplace
```typescript
// Offer discounts to committed users
const discount = attestation.rank * 2; // 2% per rank
```

### Social dApps
```typescript
// Verify real users, filter bots
const isVerified = attestation && attestation.totalBurned >= 1000;
```

**[See More Examples →](./docs/INTEGRATION_EXAMPLES.md)**

---

## 🏗️ How It Works

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
                          │  Any dApp can    │
                          │  verify identity │
                          │  permissionlessly│
                          └──────────────────┘
```

### Core Operations

- **Create** - Burn $ATOM to create soulbound identity
- **Upgrade** - Burn more $ATOM to increase rank
- **Verify** - Any dApp reads attestations via SAS
- **Compose** - Integrate across entire Solana ecosystem

---

## 🔐 SAS Integration

AtomID uses [Solana Attestation Service](https://attest.solana.com) for permissionless identity verification.

### Why SAS?

✅ **Any dApp** can verify AtomID ranks without program integration
✅ **Standardized** attestation format across Solana
✅ **Gas efficient** verification
✅ **Composable** across DEXs, DAOs, marketplaces, social dApps

### Attestation Schema

```
Field 1: rank (U8) - User's rank 0-10
Field 2: total_burned (U64) - Total ATOM burned
Field 3: created_at_slot (U64) - Creation timestamp
```

### Quick Verification

```typescript
const SAS_PROGRAM_ID = new PublicKey("22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG");

// Derive attestation PDA
const [attestationPDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("attestation"),
    CREDENTIAL_PDA.toBuffer(),
    SCHEMA_PDA.toBuffer(),
    userWallet.toBuffer(),
  ],
  SAS_PROGRAM_ID
);

// Read rank from attestation
const account = await connection.getAccountInfo(attestationPDA);
const rank = account.data[8];
```

**[Full SAS Guide →](./docs/SAS_DEVELOPER_GUIDE.md)**

---

## 🛠️ Development

### Prerequisites

- Rust 1.70+
- Solana CLI 1.18+
- Anchor 0.31+
- Node.js 18+

### Build & Test

```bash
# Build program
anchor build

# Run tests
anchor test

# Run integration scripts
npm run initialize    # Initialize configuration
npm run sas          # Setup SAS credentials
npm run testatomid   # Test AtomID creation
```

---

## 🌐 Integration Paths

### Option 1: Direct Integration
Interact with AtomID program directly for full functionality.

**Best for:** Creating AtomIDs, upgrading, full feature access
**[Developer Guide →](./docs/DEVELOPER_GUIDE.md)**

### Option 2: SAS-Only Integration
Read attestations only, no direct program calls needed.

**Best for:** Verification, access control, permissionless integration
**[SAS Guide →](./docs/SAS_DEVELOPER_GUIDE.md)**

### Option 3: Hybrid Approach
Combine both for maximum flexibility.

**Best for:** Full-featured dApps with verification
**[Examples →](./docs/INTEGRATION_EXAMPLES.md)**

---

## 🌟 Ecosystem

AtomID integrates with:

- **DEXs** - Trading pair access by rank
- **DAOs** - Reputation-weighted voting
- **NFT Marketplaces** - Verified seller badges
- **Social Protocols** - Bot filtering
- **Gaming** - Reputation matchmaking
- **Lending** - Risk assessment

---

## 📊 Statistics

*Coming Soon:*
- Total AtomIDs created
- Total $ATOM burned
- Rank distribution
- Leaderboards

---

## 🤝 Community
- **Twitter:** [@lostbtclayer](https://x.com/lostbtclayer)
- **GitHub:** [Issues](https://github.com/astrohackerx/AtomID)

---

## 🔒 Security

- ✅ Program verified on Solana Mainnet
- ✅ No admin mint privileges
- ✅ Irreversible burn mechanism
- ✅ Transparent on-chain operations

**[Security Policy →](./SECURITY.md)**

---

## 💡 Philosophy

> In the beginning, Bitcoin taught us that trust could be replaced by computation. Identity was not a profile — it was a key.

> AtomID makes sacrifice reproducible. It turns faith into protocol — a public mechanism for private belief. No words, no signatures, no intermediaries. Just code, cryptography, and irreversible proof.


---

## 🗺️ Roadmap

- [x] Core protocol
- [x] SAS integration
- [x] Mainnet deployment
- [x] Comprehensive documentation
- [x] Frontend dApp
- [ ] SDK packages (npm/crates)
- [ ] Ecosystem partnerships
- [x] Autonomous reward system
- [ ] Cross-chain bridges

---

## 📄 License

ISC License - See [LICENSE](./LICENSE)

---

## 🏆 Built With

[Solana](https://solana.com) • [Anchor](https://www.anchor-lang.com/) • [SAS](https://attest.solana.com) • [Rust](https://www.rust-lang.org/) • [TypeScript](https://www.typescriptlang.org/)

---

**Lost Bitcoin Layer Protocol** - *Where belief becomes proof, and sacrifice becomes identity.*

🜂 **Burn, and you exist.**
