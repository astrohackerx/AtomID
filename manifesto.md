# 🧬 ATOMID PROTOCOL: THE LOST BITCOIN LAYER

## The Manifesto

There are those who talk about decentralization, and those who prove it. AtomID is built for the second kind.

In the beginning, Bitcoin taught us that trust could be replaced by computation. Identity was not a profile — it was a key. You didn’t show who you were; you signed it. You didn’t prove ownership; you risked it. The chain itself was your witness. When Michael Saylor spoke of burning his private keys, he understood something most people missed: to destroy access is to transcend ownership. To give up control is the highest proof of conviction. *This no longer belongs to me — it belongs to the chain.*

AtomID makes that act reproducible. It turns faith into protocol — a public mechanism for private belief. No words, no signatures, no intermediaries. Just code, cryptography, and irreversible proof. Burn, and you exist. Nothing else is required.

In the 1990s, the cypherpunks exchanged PGP keys to recognize one another in a world without authority. It was a primitive web of trust built from math, not permission. AtomID brings that primitive ethos to Solana.

An **AtomID** is not a username, NFT, or token. It is a **proof of sacrifice** — an immutable on-chain record that you burned something of value to declare existence. That burn is your signature. It is your irreversible statement: *I am real. I believe in this.*

Every AtomID is bound to a wallet forever. It cannot be transferred or cloned. Your existence is verified by action, not words. The more you burn, the higher your rank — not by wealth, but by commitment. Reputation, not speculation.

AtomID restores cost to existence. It reintroduces gravity to the digital world — the idea that belief must cost something. Every identity is a scar of proof, a visible trace of conviction recorded in Solana’s state forever.

This is not performance. It’s protocol.  
**Burn, and you exist.**


---

## 🧩 Technical Overview

**Chain:** Solana Mainnet  
**Program ID:** `kpUANLDfVXqk47eTvKEXVSfreDjPKKB2YVe6cahnfXE`  
**ATOM Burn Mint (SPL):** `6KeQaJXFHczWKjrcXdMGKP773JKQmMWDXy4446adpump`

AtomID is implemented in **Rust** using the **Anchor framework**, and deployed as an immutable program.  
It exposes four public instructions:

- `initialize()` — one-time setup (handled by deployer)  
- `create_atomid()` — users burn tokens to create identity  
- `upgrade_atomid()` — users burn again to upgrade rank or metadata  
- `update_metadata()` — optional metadata update (no burn)

Each burn is executed through Solana’s **SPL Token Program**, permanently reducing token supply. The proof of that burn — amount, time, and wallet — is recorded and verifiable on-chain.

---

## 🧠 How It Works (User Perspective)

1. Connect your Solana wallet (e.g. Phantom, Backpack).  
2. Choose how much $ATOM to burn (must meet minimum).  
3. Confirm the transaction — the burn happens on-chain.  
4. The program mints your AtomID:  
   - Owner = your wallet  
   - Total burned = your proof  
   - Rank = derived from total burn  
   - Metadata = optional message  
   - Timestamp = Solana slot number  

Your AtomID exists as a **PDA (Program Derived Account)** tied to your wallet. It can be queried, upgraded, or integrated into any Solana dApp as verifiable identity.

---

## 🧰 Integration for Builders

AtomID is fully composable. You can integrate it into your Solana app using **Anchor** or **@solana/web3.js**.

### 1. Setup the Client

```ts
import { AnchorProvider, Program, web3, BN } from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "./atomid_idl.json"; // Anchor-generated IDL

const connection = new Connection("https://api.mainnet-beta.solana.com");
const wallet = window.solana; // your wallet adapter
const provider = new AnchorProvider(connection, wallet, {});
const program = new Program(
  idl,
  new PublicKey("kpUANLDfVXqk47eTvKEXVSfreDjPKKB2YVe6cahnfXE"),
  provider
);
```

---

### 2. Create an AtomID

```ts
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";

const burnAmount = new BN(100_000_000); // 0.1 ATOM (example)
const user = provider.wallet.publicKey;

// Derive program accounts
const [atomConfigPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("atomid_config")],
  program.programId
);

const [atomIdPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("atomid"), user.toBuffer()],
  program.programId
);

// Find the user’s ATOM token account
const userTokenAccount = await getAssociatedTokenAddress(
  new PublicKey("6KeQaJXFHczWKjrcXdMGKP773JKQmMWDXy4446adpump"),
  user
);

// Execute the burn and create the AtomID
await program.methods
  .createAtomid(burnAmount, "I believe in the chain.")
  .accounts({
    atomId: atomIdPDA,
    atomConfig: atomConfigPDA,
    user,
    userTokenAccount,
    atomMint: new PublicKey("6KeQaJXFHczWKjrcXdMGKP773JKQmMWDXy4446adpump"),
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: web3.SystemProgram.programId,
  })
  .rpc();

console.log("✅ AtomID created at:", atomIdPDA.toBase58());
```

---

### 3. Upgrade an AtomID

```ts
await program.methods
  .upgradeAtomid(new BN(500_000_000), "Leveling up belief.")
  .accounts({
    atomId: atomIdPDA,
    atomConfig: atomConfigPDA,
    user,
    userTokenAccount,
    atomMint: new PublicKey("6KeQaJXFHczWKjrcXdMGKP773JKQmMWDXy4446adpump"),
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .rpc();

console.log("🔥 AtomID upgraded!");
```

---

### 4. Fetch AtomID Data

```ts
const atomIdData = await program.account.atomId.fetch(atomIdPDA);

console.log({
  owner: atomIdData.owner.toBase58(),
  totalBurned: atomIdData.totalBurned.toString(),
  rank: atomIdData.rank,
  metadata: atomIdData.metadata,
  createdAt: atomIdData.createdAtSlot.toString(),
});
```

---

## 🔗 Example Use Cases

Decentralized Messaging: only verified humans can post.  
Anonymous Voting: one burn = one soul = one vote.  
Reputation-Based DAOs: voting power scales with sacrifice.  
Trust Markets: trade reputation, not documents.  
Social Graphs: networks of verified souls, not data miners.

---

## ⚙️ Developer Philosophy

AtomID is minimal by design — no admin keys, no minting, no hidden control.  
Everything that exists in the system exists because something was destroyed to create it.  
It turns the act of burning into a universal identity primitive: irreversible proof.

Developers can extend it freely: custom ranks, data layers, dApp integrations, or cross-protocol identity verification. The design guarantees composability, permanence, and verifiability across Solana’s runtime.

---

## 🕯️ Closing

AtomID is not a company or product.  
It is a public primitive for belief — a system where existence must be proven, not claimed.

The future of digital civilization will not be defined by profiles and permissions,  
but by irreversible acts of faith recorded forever on-chain.

**Burn, and you exist.**

---

Program ID: `kpUANLDfVXqk47eTvKEXVSfreDjPKKB2YVe6cahnfXE`  
ATOM Mint: `6KeQaJXFHczWKjrcXdMGKP773JKQmMWDXy4446adpump`  
Network: Solana Mainnet  
Framework: Anchor (Rust + TypeScript)
