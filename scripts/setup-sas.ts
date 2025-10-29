import * as anchor from "@coral-xyz/anchor";
import { Program, BN, Wallet } from "@coral-xyz/anchor";
import { AtomId } from "../target/types/atom_id";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "fs";

const SAS_PROGRAM_ID = new PublicKey("22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG");

async function main() {
  const connection = new Connection("https://broken-fittest-wave.solana-mainnet.quiknode.pro/93f43b5d1f507f1468eeafccc4c861ce5e7bbe03/", "confirmed");
  const walletPath = process.env.HOME + "/.config/solana/id.json";
  const keypairData = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));

  const wallet = new Wallet(keypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const programId = new PublicKey("2L71ccPAUz8NtKtHMUZtaopoS3CTnJSgaxatfHoGDvwM");
  const idl = JSON.parse(fs.readFileSync("./target/idl/atom_id.json", "utf-8"));
  const program = new Program(idl, provider) as Program<AtomId>;

  console.log("🔗 Setting up Solana Attestation Service for AtomID");
  console.log("Network: Mainnet");
  console.log("Authority:", keypair.publicKey.toString());
  console.log("Program ID:", programId.toString());

  const balance = await connection.getBalance(keypair.publicKey);
  console.log("Balance:", balance / 1e9, "SOL");

  console.log("");

  // Derive SAS Authority PDA (owned by AtomID program)
  const [sasAuthorityPda, sasAuthorityBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("sas_authority")],
    programId
  );

  console.log("SAS Authority PDA:", sasAuthorityPda.toString());
  console.log("");

  // ========================================
  // Step 1: Create Credential via AtomID program
  // ========================================
  console.log("📝 Step 1: Creating SAS Credential via AtomID program...");

  const credentialName = "AtomID_v1";

  // Derive credential PDA using SAS program's derivation
  const [credentialPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("credential"),
      sasAuthorityPda.toBuffer(),
      Buffer.from(credentialName),
    ],
    SAS_PROGRAM_ID
  );

  console.log("Credential PDA:", credentialPda.toString());

  let credentialExists = false;
  try {
    const credentialAccount = await connection.getAccountInfo(credentialPda);
    if (credentialAccount) {
      console.log("✅ Credential already exists!");
      credentialExists = true;
    }
  } catch (error) {
    // Doesn't exist
  }

  if (!credentialExists) {
    console.log("Creating credential through AtomID program...");

    try {
      const tx = await program.methods
        .initializeSasCredential(
          credentialName,
          "AtomID issuer credential for rank attestations"
        )
        .accounts({
          payer: keypair.publicKey,
          sasCredential: credentialPda,
          sasProgram: SAS_PROGRAM_ID,
        })
        .rpc();

      console.log("✅ Credential created!");
      console.log("Transaction:", tx);
      console.log(`View: https://explorer.solana.com/tx/${tx}`);
    } catch (error) {
      console.error("❌ Failed to create credential:", error);
      throw error;
    }
  }

  console.log("");

  // ========================================
  // Step 2: Create Schema via AtomID program
  // ========================================
  console.log("📝 Step 2: Creating AtomID Rank Schema via AtomID program...");

  const schemaName = "atomid_rank_v1";

  // Derive schema PDA using SAS program's derivation
  const schemaVersion = 1;
  const [schemaPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("schema"),
      credentialPda.toBuffer(),
      Buffer.from(schemaName),
      Buffer.from([schemaVersion]), // version as u8 (1 byte)
    ],
    SAS_PROGRAM_ID
  );

  console.log("Schema PDA:", schemaPda.toString());
  console.log("Schema Name:", schemaName);

  let schemaExists = false;
  try {
    const schemaAccount = await connection.getAccountInfo(schemaPda);
    if (schemaAccount) {
      console.log("✅ Schema already exists!");
      schemaExists = true;
    }
  } catch (error) {
    // Doesn't exist
  }

  if (!schemaExists) {
    console.log("Creating schema through AtomID program...");

    const schemaDescription = "AtomID rank attestation - Proof of ATOM burned and trust level";
    const layout = Buffer.from([0, 3, 3]); // [U8, U64, U64]
    const fieldNames = ["rank", "total_burned", "created_at_slot"];

    console.log("Layout:", layout, "(U8, U64, U64)");
    console.log("Fields:", fieldNames);

    try {
      const tx = await program.methods
        .initializeSasSchema(
          schemaName,
          schemaDescription,
          layout,
          fieldNames
        )
        .accounts({
          payer: keypair.publicKey,
          sasCredential: credentialPda,
          sasSchema: schemaPda,
          sasProgram: SAS_PROGRAM_ID,
        })
        .rpc();

      console.log("✅ Schema created!");
      console.log("Transaction:", tx);
      console.log(`View: https://explorer.solana.com/tx/${tx}`);
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
  console.log(`const sasAuthority = new PublicKey("${sasAuthorityPda}"); // PDA owned by AtomID program`);
  console.log("");
  console.log("📋 Also update src/lib/constants.ts in the frontend:");
  console.log("───────────────────────────────────────────────────────");
  console.log(`sasCredential: '${credentialPda}',`);
  console.log(`sasSchema: '${schemaPda}',`);
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
