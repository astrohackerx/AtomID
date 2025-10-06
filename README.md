# 🧩 AtomID — Proof of Existence Protocol

**Lost Bitcoin Layer | Built for the Cypherpunk Hackathon**

---

## 🌌 Overview

**AtomID** is a decentralized **proof-of-existence identity protocol** built on **Solana**.  
Each identity is **created by burning $ATOM**, the native token of the *Lost Bitcoin Layer* - reviving the forgotten idea from Satoshi’s early Bitcoin code that identity must be **earned through sacrifice**.

> 🧠 In Bitcoin, miners burn energy.  
> In AtomID, individuals burn $ATOM - transforming value into digital existence.

Every AtomID is a **soulbound on-chain identity**, immutable and verifiable, representing trust, authenticity, and participation in the rebirth of the lost layer of Bitcoin.

---

## 🔗 Core Concept

- **Token:** `$ATOM` - originated from the “Lost Bitcoin Layer” narrative.  
- **Mechanism:** Proof of Existence via token burn.  
- **Result:** Creation of a permanent identity (AtomID) tied to a Solana wallet.  
- **Philosophy:** True cypherpunk identity requires sacrifice - a proof of authenticity written on-chain.

---

## ⚙️ How It Works

### 1. Create Your AtomID
Burn a fixed amount of `$ATOM` (e.g., 1000 $ATOM) to mint your unique **AtomID**.

The burn transaction:
- Reduces circulating supply (deflationary)
- Creates a new identity record linked to your wallet
- Mints a **soulbound NFT** representing your AtomID

### 2. Upgrade Your Identity
Additional burns can **upgrade your AtomID rank** - proving deeper participation and commitment.

Each level represents:
- Total $ATOM burned (proof of sacrifice)
- Trust rank in the network
- Eligibility for gated systems (DAO, marketplace, reputation layers)

### 3. On-chain Metadata
Each AtomID stores:
- `owner`: Solana wallet public key  
- `total_burned`: total $ATOM burned by the identity  
- `rank`: derived from burn total  
- `metadata_uri`: optional (IPFS / Arweave profile data)

---

## 🛠️ Technical Architecture

| Component | Description |
|------------|-------------|
| **Chain** | Solana |
| **Framework** | Anchor (Rust) |
| **Token Standard** | SPL |
| **Identity Type** | Soulbound NFT |
| **Key Functions** | `initialize_identity()`, `burn_and_upgrade()`, `get_identity_data()` |
| **Storage** | PDA accounts per user |
| **Indexer** | Off-chain aggregator for leaderboards & reputation stats |

### 🧩 Example Flow

```rust
pub fn create_identity(ctx: Context<CreateIdentity>, burn_amount: u64) -> Result<()> {
    // 1. Burn ATOM tokens
    token::burn(ctx.accounts.burn_ctx(), burn_amount)?;
    
    // 2. Initialize or update user identity
    let id = &mut ctx.accounts.identity;
    id.owner = ctx.accounts.user.key();
    id.total_burned += burn_amount;
    id.rank = calculate_rank(id.total_burned);
    
    Ok(())
}
```

---

### 🔥 Token Utility

Burn-to-Exist: Every identity requires a burn → direct deflation of supply.

Upgrade Mechanism: Further burns increase rank → long-term recurring utility.

Integration Layer: Other protocols can verify AtomID existence or rank.

Future DAO Voting: Reputation-weighted governance based on burned ATOM.

This transforms $ATOM into a Proof-of-Existence fuel — not just a token, but the cost of identity.

---

### 🧬 Future Integrations

Atom Marketplace - Reputation-weighted commerce.

Proof-of-Trust Oracle - Verify identity rank for dApps.

AtomDAO - Rank-based governance & proposal systems.

Partner APIs — Third-party protocols can verify AtomIDs for access control or rewards.
