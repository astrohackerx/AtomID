import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import * as fs from "fs";

// SAS Program ID
const SAS_PROGRAM_ID = new PublicKey("22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG");

// Helper to serialize strings with u32 length prefix
function serializeString(str: string): Buffer {
  const strBytes = Buffer.from(str, "utf-8");
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32LE(strBytes.length, 0);
  return Buffer.concat([lengthBuf, strBytes]);
}

// Helper to serialize vec<string>
function serializeVecString(strings: string[]): Buffer {
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32LE(strings.length, 0);
  const stringBuffers = strings.map(serializeString);
  return Buffer.concat([lengthBuf, ...stringBuffers]);
}

// Helper to serialize vec<Pubkey>
function serializeVecPubkey(pubkeys: PublicKey[]): Buffer {
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32LE(pubkeys.length, 0);
  const pubkeyBuffers = pubkeys.map((pk) => pk.toBuffer());
  return Buffer.concat([lengthBuf, ...pubkeyBuffers]);
}

// Helper to serialize vec<u8>
function serializeVecU8(bytes: number[]): Buffer {
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32LE(bytes.length, 0);
  return Buffer.concat([lengthBuf, Buffer.from(bytes)]);
}

async function main() {
  // Connect to devnet
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  // Load wallet
  const walletPath = process.env.HOME + "/.config/solana/id.json";
  const keypairData = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));

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

  const [credentialPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("credential"), keypair.publicKey.toBuffer()],
    SAS_PROGRAM_ID
  );

  console.log("Credential PDA:", credentialPda.toString());

  // Check if credential already exists
  let credentialExists = false;
  try {
    const credentialAccount = await connection.getAccountInfo(credentialPda);
    if (credentialAccount) {
      console.log("✅ Credential already exists!");
      credentialExists = true;
    }
  } catch (error) {
    // Doesn't exist, we'll create it
  }

  if (!credentialExists) {
    console.log("Creating credential...");

    // Build CreateCredential instruction
    const credentialName = "AtomID";
    const signers = [keypair.publicKey];

    const instructionData = Buffer.concat([
      Buffer.from([0]), // Discriminator for CreateCredential
      serializeString(credentialName),
      serializeVecPubkey(signers),
    ]);

    const createCredentialIx = {
      programId: SAS_PROGRAM_ID,
      keys: [
        { pubkey: keypair.publicKey, isSigner: true, isWritable: true }, // payer
        { pubkey: credentialPda, isSigner: false, isWritable: true }, // credential
        { pubkey: keypair.publicKey, isSigner: true, isWritable: false }, // authority
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
      ],
      data: instructionData,
    };

    try {
      const tx = new Transaction().add(createCredentialIx);
      const sig = await sendAndConfirmTransaction(connection, tx, [keypair], {
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
  const [schemaPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("schema"), credentialPda.toBuffer(), Buffer.from(schemaName)],
    SAS_PROGRAM_ID
  );

  console.log("Schema PDA:", schemaPda.toString());
  console.log("Schema Name:", schemaName);

  // Check if schema already exists
  let schemaExists = false;
  try {
    const schemaAccount = await connection.getAccountInfo(schemaPda);
    if (schemaAccount) {
      console.log("✅ Schema already exists!");
      schemaExists = true;
    }
  } catch (error) {
    // Doesn't exist, we'll create it
  }

  if (!schemaExists) {
    console.log("Creating schema...");

    // Schema definition for AtomID
    const schemaDescription = "AtomID rank attestation - Proof of ATOM burned and trust level";
    const layout = [0, 3, 3]; // [U8, U64, U64]
    const fieldNames = ["rank", "total_burned", "created_at_slot"];

    console.log("Layout:", layout, "(U8, U64, U64)");
    console.log("Fields:", fieldNames);

    const instructionData = Buffer.concat([
      Buffer.from([1]), // Discriminator for CreateSchema
      serializeString(schemaName),
      serializeString(schemaDescription),
      serializeVecU8(layout),
      serializeVecString(fieldNames),
    ]);

    const createSchemaIx = {
      programId: SAS_PROGRAM_ID,
      keys: [
        { pubkey: keypair.publicKey, isSigner: true, isWritable: true }, // payer
        { pubkey: keypair.publicKey, isSigner: true, isWritable: false }, // authority
        { pubkey: credentialPda, isSigner: false, isWritable: false }, // credential
        { pubkey: schemaPda, isSigner: false, isWritable: true }, // schema
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
      ],
      data: instructionData,
    };

    try {
      const tx = new Transaction().add(createSchemaIx);
      const sig = await sendAndConfirmTransaction(connection, tx, [keypair], {
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
  console.log(`const sasCredential = new PublicKey("${credentialPda.toString()}");`);
  console.log(`const sasSchema = new PublicKey("${schemaPda.toString()}");`);
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
