# AtomID Documentation Index

Complete documentation for the AtomID Protocol - A proof-of-sacrifice identity system on Solana.

---

## 📚 Documentation Overview

This repository contains comprehensive documentation for developers, integrators, and users of the AtomID protocol.

### Quick Navigation

| Document | Purpose | Audience |
|----------|---------|----------|
| **[README.md](./README.md)** | Project overview and quick start | Everyone |
| **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** | Complete integration guide | Developers |
| **[SAS_DEVELOPER_GUIDE.md](./SAS_DEVELOPER_GUIDE.md)** | SAS attestation integration | Developers |
| **[INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md)** | Real-world code examples | Developers |
| **[SAS_INTEGRATION.md](./SAS_INTEGRATION.md)** | Technical SAS overview | Technical readers |
| **[manifesto.md](./manifesto.md)** | Philosophy and vision | General audience |
| **[whitepaper.md](./whitepaper.md)** | Technical architecture | Technical readers |
| **[SECURITY.md](./SECURITY.md)** | Security policy | Everyone |

---

## 🎯 Getting Started

### For End Users

1. Start with **[README.md](./README.md)** - Understand what AtomID is
2. Read **[manifesto.md](./manifesto.md)** - Learn the philosophy
3. Visit the dApp (coming soon) to create your AtomID

### For Developers

**Direct Integration Path:**

1. **[README.md](./README.md)** - Project overview
2. **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Complete integration guide
3. **[INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md)** - Copy-paste examples

**SAS-Only Integration Path:**

1. **[SAS_INTEGRATION.md](./SAS_INTEGRATION.md)** - Understand SAS integration
2. **[SAS_DEVELOPER_GUIDE.md](./SAS_DEVELOPER_GUIDE.md)** - Complete SAS guide
3. **[INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md)** - See SAS examples

### For Technical Researchers

1. **[whitepaper.md](./whitepaper.md)** - Technical architecture
2. **[SAS_INTEGRATION.md](./SAS_INTEGRATION.md)** - SAS implementation details
3. **[SECURITY.md](./SECURITY.md)** - Security considerations
4. Source code in `/programs/atom-id/src/`

---

## 📖 Document Descriptions

### Core Documentation

#### README.md
**Purpose:** Main entry point for the repository
**Contents:**
- Project overview
- Quick start guide
- Mainnet deployment information
- Key features and benefits
- Use case examples
- Rank system overview
- Community links

**Start here if:** You're new to AtomID

---

#### DEVELOPER_GUIDE.md
**Purpose:** Comprehensive developer integration guide
**Contents:**
- Installation and setup
- Complete code examples
- Direct AtomID program integration
- SAS integration basics
- API reference
- Best practices
- Real-world use cases
- Testing guidelines

**Start here if:** You want to integrate AtomID into your dApp

**Key Sections:**
- Quick Start
- Core Integration (Direct AtomID usage)
- SAS Integration (Permissionless verification)
- Complete dApp Example
- Rank System
- Use Cases

---

#### SAS_DEVELOPER_GUIDE.md
**Purpose:** Deep dive into SAS attestation integration
**Contents:**
- Why use SAS
- Installation with `sas-lib`
- Attestation schema details
- Reading attestations
- Batch operations
- Caching strategies
- Real-time updates
- Performance optimization
- 6 complete use case examples

**Start here if:** You want to verify AtomID ranks without calling the AtomID program

**Key Features:**
- Permissionless verification
- Gas-efficient reads
- Batch operations
- WebSocket subscriptions
- Production-ready patterns

---

#### INTEGRATION_EXAMPLES.md
**Purpose:** Production-ready code examples
**Contents:**
- React component (complete)
- Next.js API routes
- Backend middleware
- SAS-only integration
- Smart contract integration
- 3 real-world use cases

**Start here if:** You want copy-paste code for your project

**Examples Include:**
- Full AtomID profile component
- Server-side verification
- Express middleware
- Pure SAS integration class
- Anchor program example

---

#### SAS_INTEGRATION.md
**Purpose:** Technical overview of SAS implementation
**Contents:**
- SAS architecture overview
- How AtomID uses SAS
- Schema definition
- Attestation lifecycle
- Setup instructions
- Client usage examples

**Start here if:** You want to understand the technical details of SAS integration

---

### Philosophy & Vision

#### manifesto.md
**Purpose:** Philosophy and vision behind AtomID
**Contents:**
- Cypherpunk origins
- Proof of sacrifice concept
- Why burning matters
- Integration philosophy
- Use cases
- Future vision

**Start here if:** You want to understand the "why" behind AtomID

**Key Themes:**
- Trust through sacrifice
- Soulbound identity
- Decentralization
- Permissionless verification

---

#### whitepaper.md
**Purpose:** Technical deep dive and architecture
**Contents:**
- Lost Bitcoin Layer origin
- AtomID architecture
- Three core primitives
- SAS integration details
- Autonomous reward system
- Economic model
- Future roadmap

**Start here if:** You want comprehensive technical details

**Key Sections:**
- Origin: Atoms and Lost Bitcoin Layer
- Architecture: Structure of the Lost Bitcoin Layer
- AtomID: Proof of Sacrifice Identity
- SAS Integration
- The Revelation: Civilization of Faith

---

### Security

#### SECURITY.md
**Purpose:** Security policy and vulnerability reporting
**Contents:**
- Security policy
- Audit status
- How to report vulnerabilities
- Security best practices
- Contact information

**Start here if:** You found a security issue or want to understand security measures

---

## 🔗 External Resources

### Official Links

- **AtomID Program (Mainnet):** [Solscan](https://solscan.io/account/rnc2fycemiEgj4YbMSuwKFpdV6nkJonojCXib3j2by6)
- **$ATOM Token:** [Solscan](https://solscan.io/token/6KeQaJXFHczWKjrcXdMGKP773JKQmMWDXy4446adpump)
- **SAS Program:** [Solscan](https://solscan.io/account/22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG)

### SAS Resources

- **SAS Documentation:** https://attest.solana.com/docs
- **SAS GitHub:** https://github.com/solana-foundation/solana-attestation-service
- **sas-lib npm package:** https://www.npmjs.com/package/sas-lib

---

## 🚀 Integration Quick Reference

### 1. Check if User Has AtomID

```typescript
// Direct method
const atomId = await program.account.atomId.fetch(atomIdPDA);

// SAS method (permissionless)
const attestation = await connection.getAccountInfo(attestationPDA);
```

### 2. Get User Rank

```typescript
// Direct method
const rank = atomId.rank;

// SAS method
const rank = attestation.data[8];
```

### 3. Verify Minimum Rank

```typescript
// Direct method
const hasAccess = atomId.rank >= 5;

// SAS method
const rank = attestation.data[8];
const hasAccess = rank >= 5;
```

### 4. Create AtomID

```typescript
await program.methods
  .createAtomid(burnAmount, metadata)
  .accounts({ /* ... */ })
  .rpc();
```

### 5. Upgrade AtomID

```typescript
await program.methods
  .upgradeAtomid(additionalBurnAmount, newMetadata)
  .accounts({ /* ... */ })
  .rpc();
```

---

## 🎓 Learning Paths

### Path 1: Frontend Integration
1. Read README.md
2. Review DEVELOPER_GUIDE.md (Focus: Quick Start, Core Integration)
3. Copy code from INTEGRATION_EXAMPLES.md (React component)
4. Test on Mainnet

### Path 2: Backend Integration
1. Read README.md
2. Review SAS_DEVELOPER_GUIDE.md
3. Copy code from INTEGRATION_EXAMPLES.md (Express middleware)
4. Test with API calls

### Path 3: Smart Contract Integration
1. Read whitepaper.md
2. Review SAS_INTEGRATION.md
3. Study INTEGRATION_EXAMPLES.md (Anchor program)
4. Implement in your program

### Path 4: Understanding the Vision
1. Read manifesto.md
2. Read whitepaper.md
3. Review SECURITY.md
4. Explore use cases in DEVELOPER_GUIDE.md

---

## 💡 FAQ

### "I want to verify AtomID ranks without integrating the program directly"
**Read:** [SAS_DEVELOPER_GUIDE.md](./SAS_DEVELOPER_GUIDE.md)

### "I need complete code examples"
**Read:** [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md)

### "I want to understand the technical architecture"
**Read:** [whitepaper.md](./whitepaper.md)

### "How do I create an AtomID?"
**Read:** [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - Section "Create an AtomID"

### "What's the difference between direct and SAS integration?"
- **Direct:** Call AtomID program directly (more features, requires program integration)
- **SAS:** Read attestations only (permissionless, gas-efficient, read-only)

**Read:** [SAS_INTEGRATION.md](./SAS_INTEGRATION.md) for details

### "I found a security vulnerability"
**Read:** [SECURITY.md](./SECURITY.md) and follow the reporting guidelines

---

## 🛠️ Additional Resources

### Code Examples
- `/scripts/initialize.ts` - Initialize program
- `/scripts/setup-sas.ts` - Setup SAS credential and schema
- `/scripts/test-atomid.ts` - Complete integration test
- `/programs/atom-id/src/lib.rs` - Program source code
- `/programs/atom-id/src/sas_integration.rs` - SAS integration module

### IDL (Interface Description Language)
- `/idl/atom_id.json` - Program IDL for client integration

---

## 🤝 Community & Support

- **Discord:** [Join Community](https://discord.gg/atomid)
- **Twitter:** [@AtomIDProtocol](https://twitter.com/atomidprotocol)
- **Telegram:** [AtomID Developers](https://t.me/atomid_dev)
- **GitHub Issues:** [Report bugs](https://github.com/yourusername/atomid/issues)

---

## 📝 Contributing

We welcome documentation improvements! If you find:
- Typos or errors
- Missing examples
- Unclear explanations
- Areas for improvement

Please open an issue or submit a pull request.

---

## 📄 License

All documentation is licensed under ISC License. See [LICENSE](./LICENSE) for details.

---

**Last Updated:** 2025-10-31

**AtomID Protocol** - *Where belief becomes proof, and sacrifice becomes identity.*

🜂 **Burn, and you exist.**
