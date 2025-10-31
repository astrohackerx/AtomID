# AtomID Documentation Structure

## 📁 File Organization

```
atomid/
├── README.md                      # Main entry point - Start here!
├── SECURITY.md                    # Security policy
├── manifesto.md                   # Philosophy and vision
├── whitepaper.md                  # Technical architecture
│
├── docs/                          # All developer documentation
│   ├── QUICK_REFERENCE.md         # One-page cheat sheet
│   ├── DEVELOPER_GUIDE.md         # Complete integration guide
│   ├── SAS_DEVELOPER_GUIDE.md     # SAS integration guide
│   ├── SAS_INTEGRATION.md         # Technical SAS overview
│   ├── INTEGRATION_EXAMPLES.md    # Production-ready code
│   └── DOCUMENTATION_INDEX.md     # Documentation navigation
│
├── programs/                      # Solana program source
│   └── atom-id/
│       └── src/
│           ├── lib.rs             # Main program logic
│           └── sas_integration.rs # SAS integration module
│
├── scripts/                       # Deployment & testing scripts
│   ├── initialize.ts              # Initialize program
│   ├── setup-sas.ts              # Setup SAS credentials
│   └── test-atomid.ts            # Integration tests
│
└── idl/                          # Interface Definition Language
    └── atom_id.json              # Program IDL
```

---

## 📚 Documentation Quick Links

### Root Files (Main Directory)

| File | Purpose | Audience |
|------|---------|----------|
| **[README.md](../README.md)** | Project overview, quick start, links to all docs | Everyone - Start here! |
| **[SECURITY.md](../SECURITY.md)** | Security policy and vulnerability reporting | Everyone |
| **[manifesto.md](../manifesto.md)** | Philosophy and vision | General audience |
| **[whitepaper.md](../whitepaper.md)** | Technical architecture | Technical readers |

### docs/ Directory

| File | Purpose | Audience |
|------|---------|----------|
| **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** | One-page cheat sheet with code snippets | Developers (quick integration) |
| **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** | Complete integration guide (23KB) | Developers (full implementation) |
| **[SAS_DEVELOPER_GUIDE.md](./SAS_DEVELOPER_GUIDE.md)** | SAS integration with sas-lib (22KB) | Developers (permissionless verification) |
| **[SAS_INTEGRATION.md](./SAS_INTEGRATION.md)** | Technical SAS overview (9KB) | Technical readers |
| **[INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md)** | Production-ready code (21KB) | Developers (copy-paste) |
| **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** | Complete doc navigation (10KB) | Everyone |

---

## 🎯 Which File Should I Read?

### I want to understand what AtomID is
→ **[README.md](../README.md)**

### I want to integrate AtomID into my dApp
→ **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)**

### I need quick code snippets
→ **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)**

### I want to verify AtomID ranks without calling the program
→ **[SAS_DEVELOPER_GUIDE.md](./SAS_DEVELOPER_GUIDE.md)**

### I need copy-paste production code
→ **[INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md)**

### I want to understand the technical architecture
→ **[whitepaper.md](../whitepaper.md)**

### I want to understand the philosophy
→ **[manifesto.md](../manifesto.md)**

### I found a security issue
→ **[SECURITY.md](../SECURITY.md)**

### I'm lost and need navigation
→ **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)**

---

## 📏 File Sizes

| File | Size | Description |
|------|------|-------------|
| DEVELOPER_GUIDE.md | 23KB | Most comprehensive developer guide |
| SAS_DEVELOPER_GUIDE.md | 22KB | Complete SAS integration guide |
| INTEGRATION_EXAMPLES.md | 21KB | Production-ready code examples |
| README.md | 10KB | Main entry point |
| whitepaper.md | 11KB | Technical architecture |
| DOCUMENTATION_INDEX.md | 10KB | Documentation navigation |
| SAS_INTEGRATION.md | 9KB | Technical SAS overview |
| QUICK_REFERENCE.md | 8KB | One-page cheat sheet |
| manifesto.md | 8KB | Philosophy and vision |
| SECURITY.md | 4KB | Security policy |

**Total Documentation:** ~125KB of comprehensive guides

---

## 🔄 Documentation Flow

### For First-Time Developers

```
1. README.md
   ↓
2. QUICK_REFERENCE.md (scan for overview)
   ↓
3. DEVELOPER_GUIDE.md (read in full)
   ↓
4. INTEGRATION_EXAMPLES.md (copy code)
   ↓
5. Test on mainnet
```

### For SAS Integration Only

```
1. README.md
   ↓
2. SAS_INTEGRATION.md (understand concept)
   ↓
3. SAS_DEVELOPER_GUIDE.md (implementation)
   ↓
4. INTEGRATION_EXAMPLES.md (SAS-only section)
   ↓
5. Implement verification
```

### For Understanding the Vision

```
1. README.md
   ↓
2. manifesto.md
   ↓
3. whitepaper.md
   ↓
4. Explore use cases in docs/
```

---

## 📝 Documentation Standards

All documentation follows these standards:

✅ **Real mainnet addresses** - No placeholders
✅ **Working Solscan links** - Direct to verified contracts
✅ **Production-ready code** - Tested on mainnet
✅ **Clear examples** - Copy-paste and run
✅ **Best practices** - Security and performance
✅ **Multiple audiences** - Technical and non-technical

---

## 🔗 External Links in Docs

All documentation includes links to:

- [Solscan Explorer](https://solscan.io/) - View contracts
- [SAS Documentation](https://attest.solana.com/docs) - Official SAS docs
- [Anchor Framework](https://www.anchor-lang.com/) - Solana dev framework
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/) - Client library

---

## 🎓 Learning Paths

### Path 1: Quick Integration (1-2 hours)
1. QUICK_REFERENCE.md
2. INTEGRATION_EXAMPLES.md (React component)
3. Test on mainnet

### Path 2: Full Integration (4-6 hours)
1. README.md
2. DEVELOPER_GUIDE.md
3. INTEGRATION_EXAMPLES.md (all sections)
4. Test and deploy

### Path 3: SAS-Only (2-3 hours)
1. SAS_INTEGRATION.md
2. SAS_DEVELOPER_GUIDE.md
3. INTEGRATION_EXAMPLES.md (SAS section)
4. Implement

### Path 4: Deep Understanding (6-8 hours)
1. manifesto.md
2. whitepaper.md
3. DEVELOPER_GUIDE.md
4. SAS_DEVELOPER_GUIDE.md
5. Source code review

---

## 🤝 Contributing to Docs

To improve documentation:

1. Open an issue describing the improvement
2. Fork the repository
3. Make changes to docs/
4. Submit pull request
5. We'll review and merge

**Documentation contributions are highly valued!**

---

## 📊 Documentation Coverage

- ✅ Getting started guides
- ✅ Complete API reference
- ✅ Integration examples
- ✅ Use case demonstrations
- ✅ Best practices
- ✅ Security guidelines
- ✅ Performance tips
- ✅ Error handling
- ✅ Testing guidance
- ✅ Philosophy and vision

---

## 🔍 Search & Find

Can't find what you need?

1. Check **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - Complete navigation
2. Use GitHub search in the repo
3. Ask in Discord or Telegram
4. Open a GitHub issue

---

**Last Updated:** 2025-10-31

🜂 **Well-organized docs for well-organized developers.**
