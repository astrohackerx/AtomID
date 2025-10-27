import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import * as fs from "fs";
import {
  deriveCredentialPda,
  deriveSchemaPda,
  getCreateCredentialInstruction,
  getCreateSchemaInstruction,
} from "sas-lib";
import { address, generateKeyPairSigner, createSolanaRpc, createSolanaRpcSubscriptions, createKeyPairSignerFromBytes } from "@solana/kit";

async function main() {
  // Connect to devnet
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const rpc = createSolanaRpc("https://api.devnet.solana.com");
  const rpcSubscriptions = createSolanaRpcSubscriptions("wss://api.devnet.solana.com");

  // Load wallet
  const possiblePaths = [
    process.env.SOLANA_KEYPAIR_PATH,
    "/home/neo/.config/solana/id.json",
    (process.env.HOME || "/root") + "/.config/solana/id.json",
  ].filter(Boolean) as string[];

  let keypairData: number[] | null = null;
  let walletPath: string = "";

  for (const path of possiblePaths) {
    try {
      if (fs.existsSync(path)) {
        keypairData = JSON.parse(fs.readFileSync(path, "utf-8"));
        walletPath = path;
        break;
      }
    } catch (error) {
      // Try next path
    }
  }

  if (!keypairData) {
    console.error("❌ Could not find Solana keypair. Tried:");
    possiblePaths.forEach((p) => console.error(`  - ${p}`));
    console.error("\nSet SOLANA_KEYPAIR_PATH environment variable or ensure keypair exists");
    process.exit(1);
  }

  const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
  const authority = await createKeyPairSignerFromBytes(new Uint8Array(keypairData));

  console.log("🔗 Setting up Solana Attestation Service for AtomID");
  console.log("Network: Devnet");
  console.log("Authority:", keypair.publicKey.toString());

  // Check balance
  const balance = await connection.getBalance(keypair.publicKey);
  console.log("Balance:", balance / 1e9, "SOL");

  if (balance < 0.1e9) {
    console.log("\n⚠️  Low balance! Get devnet SOL from:");
    console.log("https://faucet.solana.com/");
    return;
  }

  console.log("");

  // ========================================
  // Step 1: Create Credential
  // ========================================
  console.log("📝 Step 1: Creating SAS Credential...");

  const credentialName = "AtomID";
  const [credentialPda] = await deriveCredentialPda({
    authority: address(keypair.publicKey.toString()),
    name: credentialName,
  });

  console.log("Credential PDA:", credentialPda);

  // Check if credential already exists
  let credentialExists = false;
  try {
    const credentialAccount = await connection.getAccountInfo(new PublicKey(credentialPda));
    if (credentialAccount) {
      console.log("✅ Credential already exists!");
      credentialExists = true;
    }
  } catch (error) {
    // Doesn't exist, we'll create it
  }

  if (!credentialExists) {
    console.log("Creating credential...");

    // Generate an authorized signer (can be the authority itself)
    const authorizedSigner = await generateKeyPairSigner();

    const createCredentialIx = getCreateCredentialInstruction({
      payer: authority,
      credential: credentialPda,
      authority,
      name: credentialName,
      signers: [authorizedSigner.address],
    });

    try {
      // Convert to legacy transaction format
      const { blockhash } = await connection.getLatestBlockhash();
      const legacyTx = {
        feePayer: keypair.publicKey,
        blockhash,
        lastValidBlockHeight: (await connection.getBlockHeight()) + 150,
        instructions: [
          {
            programId: new PublicKey(createCredentialIx.programAddress),
            keys: createCredentialIx.accounts.map((acc) => ({
              pubkey: new PublicKey(acc.address),
              isSigner: acc.role === 2 || acc.role === 3, // Signer roles
              isWritable: acc.role === 1 || acc.role === 3, // Writable roles
            })),
            data: Buffer.from(createCredentialIx.data),
          },
        ],
      };

      const transaction = new (require("@solana/web3.js").Transaction)();
      transaction.feePayer = legacyTx.feePayer;
      transaction.recentBlockhash = legacyTx.blockhash;
      transaction.add(legacyTx.instructions[0]);

      const sig = await sendAndConfirmTransaction(connection, transaction, [keypair], {
        commitment: "confirmed",
      });

      console.log("✅ Credential created!");
      console.log("Transaction:", sig);
      console.log(`View: https://explorer.solana.com/tx/${sig}?cluster=devnet`);
    } catch (error) {
      console.error("❌ Failed to create credential:", error);
      throw error;
    }
  }

  console.log("");

  // ========================================
  // Step 2: Create Schema
  // ========================================
  console.log("📝 Step 2: Creating AtomID Rank Schema...");

  const schemaName = "atomid_rank_v1";
  const schemaVersion = 1;
  const [schemaPda] = await deriveSchemaPda({
    credential: credentialPda,
    name: schemaName,
    version: schemaVersion,
  });

  console.log("Schema PDA:", schemaPda);
  console.log("Schema Name:", schemaName);

  // Check if schema already exists
  let schemaExists = false;
  try {
    const schemaAccount = await connection.getAccountInfo(new PublicKey(schemaPda));
    if (schemaAccount) {
      console.log("✅ Schema already exists!");
      schemaExists = true;
    }
  } catch (error) {
    // Doesn't exist, we'll create it
  }

  if (!schemaExists) {
    console.log("Creating schema...");

    const schemaDescription = "AtomID rank attestation - Proof of ATOM burned and trust level";
    const layout = [0, 3, 3]; // [U8, U64, U64]
    const fieldNames = ["rank", "total_burned", "created_at_slot"];

    console.log("Layout:", layout, "(U8, U64, U64)");
    console.log("Fields:", fieldNames);

    const createSchemaIx = getCreateSchemaInstruction({
      payer: authority,
      authority,
      credential: credentialPda,
      schema: schemaPda,
      name: schemaName,
      description: schemaDescription,
      layout: new Uint8Array(layout),
      fieldNames,
    });

    try {
      // Convert to legacy transaction format
      const { blockhash } = await connection.getLatestBlockhash();
      const legacyTx = {
        feePayer: keypair.publicKey,
        blockhash,
        lastValidBlockHeight: (await connection.getBlockHeight()) + 150,
        instructions: [
          {
            programId: new PublicKey(createSchemaIx.programAddress),
            keys: createSchemaIx.accounts.map((acc) => ({
              pubkey: new PublicKey(acc.address),
              isSigner: acc.role === 2 || acc.role === 3,
              isWritable: acc.role === 1 || acc.role === 3,
            })),
            data: Buffer.from(createSchemaIx.data),
          },
        ],
      };

      const transaction = new (require("@solana/web3.js").Transaction)();
      transaction.feePayer = legacyTx.feePayer;
      transaction.recentBlockhash = legacyTx.blockhash;
      transaction.add(legacyTx.instructions[0]);

      const sig = await sendAndConfirmTransaction(connection, transaction, [keypair], {
        commitment: "confirmed",
      });

      console.log("✅ Schema created!");
      console.log("Transaction:", sig);
      console.log(`View: https://explorer.solana.com/tx/${sig}?cluster=devnet`);
    } catch (error) {
      console.error("❌ Failed to create schema:", error);
      throw error;
    }
  }

  console.log("");

  // ========================================
  // Summary
  // ========================================
  console.log("═══════════════════════════════════════════════════════");
  console.log("🎉 SAS Setup Complete!");
  console.log("═══════════════════════════════════════════════════════");
  console.log("");
  console.log("📋 Copy these values to scripts/initialize.ts:");
  console.log("───────────────────────────────────────────────────────");
  console.log(`const sasCredential = new PublicKey("${credentialPda}");`);
  console.log(`const sasSchema = new PublicKey("${schemaPda}");`);
  console.log(`const sasAuthority = keypair.publicKey; // ${keypair.publicKey.toString()}`);
  console.log("");
  console.log("✅ Next step: Update initialize.ts and run it!");
  console.log("");
}

main()
  .then(() => {
    console.log("✨ Done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Error during SAS setup:");
    console.error(err);
    process.exit(1);
  });
