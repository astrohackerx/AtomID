🌌 ATOM ID PROTOCOL
“Identity without control. Trust through burn.”
🔥 1. The Vision: Reborn Satoshi’s Forgotten Civilization

AtomID is the core identity protocol of the Lost Bitcoin Layer — a decentralized registry of human trust and digital legacy.
In AtomID, identity is not owned — it is burned into the chain, a permanent mark of faith and contribution.

Each AtomID is minted by destroying $ATOM — proving devotion through sacrifice.
Each record holds a fragment of metadata: name, message, hash, or symbolic signature.
It’s the cypherpunk oath rebuilt — value without ownership, identity without authority.

“In Bitcoin we trusted the math.
In AtomID we burn for truth.”

⚙️ 2. Protocol Overview

AtomID is a Solana smart contract (Anchor program) that lets users:

🔥 Burn $ATOM tokens to register a permanent ID.

🧬 Store metadata on-chain (name, statement, commitment hash, etc.).

🔄 Update metadata if ownership key matches.

📖 Read data directly from Solana (no indexer needed).

🧩 Integrate with other Solana apps (NFTs, dApps, social identity).

🏗️ Evolve into a multi-chain trust layer (future integrations with Solana Name Service, Wallet Adapter, etc.).

🧠 3. Narrative Context

AtomID sits at the intersection of mythology and mechanism.

Concept	Meaning
Burn = Faith	Destroying tokens symbolizes commitment and proof-of-sacrifice.
Metadata = Soulprint	Each AtomID stores a message, name, or symbol left by its creator.
Chain = Memory	The blockchain becomes a library of burned oaths and digital relics.
Legacy	The act of burning becomes identity itself — a ritual of trust beyond ownership.

AtomID represents a philosophical leap:
From “Who owns this?” → to “Who sacrificed for this?”

🧩 4. System Architecture
🔗 Smart Contract Layer (Anchor on Solana)

The AtomID program handles:

Function	Description
create_id()	Burns $ATOM and registers a new AtomID with metadata
update_id()	Allows owner to modify metadata (if permitted)
get_metadata()	Public read-only method to fetch data from chain
get_all_ids()	Returns paginated AtomID list directly via Solana RPC
verify_id()	Checks validity, burn amount, and metadata integrity
📊 Data Schema (On-chain Account)

Each AtomID account contains:

Field	Type	Description
owner	Pubkey	Creator wallet
id	u64	Unique AtomID number
burn_amount	u64	Amount of $ATOM burned
metadata	String	Text message, name, or symbol
timestamp	i64	Unix time of registration
🔥 Burn Mechanism

Each AtomID requires a minimum burn (e.g., 10 $ATOM).

Tokens are permanently destroyed, creating deflationary scarcity.

The burn acts as proof of devotion and anti-sybil protection.


🧩 Interactions (JS/TS SDK)

You can call the program using Solana Web3 or Anchor client:

const program = new anchor.Program(idl, programId, provider);

// Burn and create AtomID
await program.methods
  .createId("My eternal name", new BN(10_000000)) // 10 ATOM (6 decimals)
  .accounts({
    user: provider.wallet.publicKey,
    atomMint: atomMintPubkey,
    atomAccount: userAtomAccount,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

🧠 Reading On-chain Data

use Solana’s getProgramAccounts:

const ids = await connection.getProgramAccounts(programId);
const parsed = ids.map(a => program.coder.accounts.decode('AtomID', a.account.data));


You can build:

On-chain leaderboards by total burn amount

Lists of verified oaths

User profiles tied to wallet signatures

💻 6. Frontend / App Workflow
App Modules
Module	Purpose
Home	Intro, philosophy, “Burn to Begin” CTA
Create ID	Burn interface + form for metadata
Explore	Leaderboard of IDs with live RPC reads
Profile	User’s created IDs, connected wallet
Hall of Flame	Top burners, eternal registry
Developers	Docs, API examples, schema, IDL
Functional Flow

Connect Wallet → Solana Wallet Adapter (Phantom, Backpack, etc.)

Enter Metadata → User writes message (optional).

Choose Burn Amount → Input $ATOM amount (≥ min burn).

Confirm Transaction → Executes burn + creates AtomID on Solana.

App Fetches Data → Reads on-chain via getProgramAccounts.

Display in Leaderboard → Automatically ranked by burn amount.

Profile Management → Shows user’s IDs, burn history, metadata.


🧭 8. Future Integrations
Integration	Description
🪪 SPL Identity Integration	Sync AtomID with existing Solana ID systems
🌍 Cross-chain Mirror	Map AtomID proofs to EVM, BTC, or ICP
🧬 NFT Avatar Binding	Link AtomID to a visual or NFT representation
⚔️ Game/Metaverse Usage	Use AtomID as player identity or rank proof
🔗 Trust Graph Protocol	Connect IDs by mutual burn-based signatures
🧠 AI Memory Layer	Integrate with SOLINUX AI for self-learning identities
🧬 9. Example Metadata Use Cases
Example	Description
"I burn for truth"	Personal oath or manifesto
"Proof of Humanity: Alice"	Simple self-verification
"SHA256:0x3f…"	Commit hash for data integrity
"Link to art, document, or claim"	Attachable metadata
"Legacy of 10,000 ATOM burned"	Symbolic or ritual entries

🔮 11. Long-term Vision

AtomID is not just a registry.
It’s the foundation of decentralized memory — the base layer of identity for the Lost Bitcoin Layer, Solinux, and beyond.

Every burn is a proof of trust.

Every metadata line is a fragment of consciousness.

Every ID is a soul on-chain.

When all ownership fades, what remains are the burned marks of belief.

“We don’t store users.
We store legacies.”
