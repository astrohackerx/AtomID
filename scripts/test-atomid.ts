import * as anchor from "@coral-xyz/anchor";
import { Program, BN, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram, ComputeBudgetProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import * as fs from "fs";

const SAS_PROGRAM_ID = new PublicKey("22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG");

// Helper function to derive PDAs
function derivePDAs(programId: PublicKey, userPubkey: PublicKey, sasCredential: PublicKey, sasSchema: PublicKey) {
  const [atomIdPda, atomIdBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("atomid"), userPubkey.toBuffer()],
    programId
  );

  const [configPda, configBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("atomid_config")],
    programId
  );

  const [sasAuthorityPda, sasAuthorityBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("sas_authority")],
    programId
  );

  const [sasAttestationPda, sasAttestationBump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("attestation"),
      sasCredential.toBuffer(),
      sasSchema.toBuffer(),
      userPubkey.toBuffer(),
    ],
    SAS_PROGRAM_ID
  );

  const [sasEventAuthorityPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("__event_authority")],
    SAS_PROGRAM_ID
  );

  return {
    atomIdPda,
    atomIdBump,
    configPda,
    configBump,
    sasAuthorityPda,
    sasAuthorityBump,
    sasAttestationPda,
    sasAttestationBump,
    sasEventAuthorityPda,
  };
}

async function main() {
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║         AtomID Protocol - Complete Integration Test          ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝\n");

  // Setup connection and wallet
  const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed"); //change to custom rpc
  const walletPath = process.env.HOME + "/.config/solana/id.json";
  const keypairData = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const payer = Keypair.fromSecretKey(new Uint8Array(keypairData));

  const wallet = new Wallet(payer);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const programId = new PublicKey("rnc2fycemiEgj4YbMSuwKFpdV6nkJonojCXib3j2by6");
  const idl = JSON.parse(fs.readFileSync("./target/idl/atom_id.json", "utf-8"));
  const program: any = new Program(idl, provider);

  const burnMint = new PublicKey("6KeQaJXFHczWKjrcXdMGKP773JKQmMWDXy4446adpump");
  const sasCredential = new PublicKey("5Ldy7HgzHqmQvX6xQJShzzinmM6yj7bQWLSzAAbUE4Nr");
  const sasSchema = new PublicKey("833nW63cXf3q14uz1otraFknAeMAfw8yFwEPGmAhG8xA");

  console.log("🔧 Configuration");
  console.log("─────────────────────────────────────────────────────────────");
  console.log("Network:        Mainnet");
  console.log("Program ID:     ", programId.toString());
  console.log("Payer:          ", payer.publicKey.toString());
  console.log("Burn Mint:      ", burnMint.toString());
  console.log("SAS Credential: ", sasCredential.toString());
  console.log("SAS Schema:     ", sasSchema.toString());
  console.log("");

  const balance = await connection.getBalance(payer.publicKey);
  console.log("💰 Payer Balance:", (balance / 1e9).toFixed(4), "SOL");


  // Derive all PDAs
  const pdas = derivePDAs(programId, payer.publicKey, sasCredential, sasSchema);

  console.log("\n📍 Derived PDAs");
  console.log("─────────────────────────────────────────────────────────────");
  console.log("Config PDA:          ", pdas.configPda.toString());
  console.log("AtomID PDA:          ", pdas.atomIdPda.toString());
  console.log("SAS Authority PDA:   ", pdas.sasAuthorityPda.toString());
  console.log("SAS Attestation PDA: ", pdas.sasAttestationPda.toString());
  console.log("");

  // Check if config exists
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("STEP 1: Verify Program Configuration");
  console.log("═══════════════════════════════════════════════════════════════\n");

  let config;
  try {
    config = await program.account.atomConfig.fetch(pdas.configPda);
    console.log("✅ Config exists");
    console.log("   Admin:           ", config.admin.toString());
    console.log("   Min Create Burn: ", config.minCreateBurn.toString());
    console.log("   Burn Mint:       ", config.burnMint.toString());
    console.log("   SAS Credential:  ", config.sasCredential.toString());
    console.log("   SAS Schema:      ", config.sasSchema.toString());
    console.log("   SAS Authority:   ", config.sasAuthority.toString());

    // Verify SAS values match
    const credsMatch = config.sasCredential.equals(sasCredential);
    const schemaMatch = config.sasSchema.equals(sasSchema);
    const authorityMatch = config.sasAuthority.equals(pdas.sasAuthorityPda);

    if (!credsMatch || !schemaMatch || !authorityMatch) {
      console.log("\n❌ MISMATCH DETECTED!");
      console.log("   Credential match:  ", credsMatch ? "✅" : "❌");
      console.log("   Schema match:      ", schemaMatch ? "✅" : "❌");
      console.log("   Authority match:   ", authorityMatch ? "✅" : "❌");
      console.log("\n💡 Run initialize.ts with correct SAS values");
      process.exit(1);
    }
    console.log("\n✅ All SAS configuration values match!");
  } catch (err) {
    console.log("❌ Config not found. Run: npm run initialize");
    process.exit(1);
  }

  // Check user's token account
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("STEP 2: Check User Token Balance");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const userTokenAccount = await getAssociatedTokenAddress(burnMint, payer.publicKey);
  console.log("User Token Account:", userTokenAccount.toString());

  let tokenBalance = 0n;
  try {
    const tokenAccountInfo = await getAccount(connection, userTokenAccount);
    tokenBalance = tokenAccountInfo.amount;
    console.log("✅ Token account exists");
    console.log("   Balance:", (Number(tokenBalance) / 1_000_000).toLocaleString(), "$ATOM");
  } catch (err) {
    console.log("❌ Token account not found or empty");
    console.log("💡 You need $ATOM tokens to test. Get them from the mint authority.");
    process.exit(1);
  }

  const minBurn = config.minCreateBurn.toNumber();
  if (Number(tokenBalance) < minBurn) {
    console.log("\n⚠️  Insufficient balance!");
    console.log("   Required:", (minBurn / 1_000_000).toLocaleString(), "$ATOM");
    console.log("   Current: ", (Number(tokenBalance) / 1_000_000).toLocaleString(), "$ATOM");
    process.exit(1);
  }

  console.log("✅ Sufficient balance for testing");

  // Check if AtomID already exists
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("STEP 3: Check Existing AtomID");
  console.log("═══════════════════════════════════════════════════════════════\n");

  let atomIdExists = false;
  let existingAtomId;
  try {
    existingAtomId = await program.account.atomId.fetch(pdas.atomIdPda);
    atomIdExists = true;
    console.log("✅ AtomID already exists for this wallet");
    console.log("   Owner:        ", existingAtomId.owner.toString());
    console.log("   Total Burned: ", existingAtomId.totalBurned.toString(), "($" + (existingAtomId.totalBurned.toNumber() / 1_000_000).toLocaleString() + " ATOM)");
    console.log("   Rank:         ", existingAtomId.rank);
    console.log("   Metadata:     ", existingAtomId.metadata || "(none)");
    console.log("   Created at:   ", existingAtomId.createdAtSlot.toString());
    console.log("   Updated at:   ", existingAtomId.updatedAtSlot.toString());
  } catch (err) {
    console.log("ℹ️  No existing AtomID found (this is expected for first test)");
  }

  // Check SAS attestation
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("STEP 4: Check SAS Attestation");
  console.log("═══════════════════════════════════════════════════════════════\n");

  let attestationExists = false;
  try {
    const attestationInfo = await connection.getAccountInfo(pdas.sasAttestationPda);
    if (attestationInfo) {
      attestationExists = true;
      console.log("✅ SAS Attestation exists");
      console.log("   Address:", pdas.sasAttestationPda.toString());
      console.log("   Owner:  ", attestationInfo.owner.toString());
      console.log("   Size:   ", attestationInfo.data.length, "bytes");
    } else {
      console.log("ℹ️  No attestation found (will be created)");
    }
  } catch (err) {
    console.log("ℹ️  No attestation found (will be created)");
  }

  // Decide what to test
  if (!atomIdExists) {
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("STEP 5: CREATE ATOMID TEST");
    console.log("═══════════════════════════════════════════════════════════════\n");

    const burnAmount = new BN(minBurn);
    const testMetadata = "Test AtomID - Created via backend test script";

    console.log("🔥 Creating AtomID...");
    console.log("   Burn Amount:", (burnAmount.toNumber() / 1_000_000).toLocaleString(), "$ATOM");
    console.log("   Metadata:   ", testMetadata);
    console.log("");

    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: 400_000,
    });

    try {
      const tx = await program.methods
        .createAtomid(burnAmount, testMetadata)
        .accountsPartial({
          atomId: pdas.atomIdPda,
          atomConfig: pdas.configPda,
          user: payer.publicKey,
          userTokenAccount,
          atomMint: burnMint,
          sasAttestation: pdas.sasAttestationPda,
          sasCredential,
          sasSchema,
          sasAuthority: pdas.sasAuthorityPda,
          sasProgram: SAS_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .preInstructions([modifyComputeUnits])
        .rpc();

      console.log("✅ CREATE ATOMID SUCCESSFUL!");
      console.log("   Transaction:", tx);
      console.log("   View on Solscan: https://solscan.io/tx/" + tx + "?cluster=devnet");
      console.log("");

      // Wait for confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Fetch and display created AtomID
      const newAtomId = await program.account.atomId.fetch(pdas.atomIdPda);
      console.log("📋 Created AtomID Details:");
      console.log("   Owner:        ", newAtomId.owner.toString());
      console.log("   Total Burned: ", newAtomId.totalBurned.toString(), "($" + (newAtomId.totalBurned.toNumber() / 1_000_000).toLocaleString() + " ATOM)");
      console.log("   Rank:         ", newAtomId.rank);
      console.log("   Metadata:     ", newAtomId.metadata);
      console.log("   Created at:   ", newAtomId.createdAtSlot.toString());

      // Verify attestation was created
      const attestationInfo = await connection.getAccountInfo(pdas.sasAttestationPda);
      if (attestationInfo) {
        console.log("\n✅ SAS Attestation Created:");
        console.log("   Address:", pdas.sasAttestationPda.toString());
        console.log("   Owner:  ", attestationInfo.owner.toString());
        console.log("   Size:   ", attestationInfo.data.length, "bytes");
      } else {
        console.log("\n⚠️  Attestation not found (unexpected)");
      }

    } catch (err: any) {
      console.log("❌ CREATE ATOMID FAILED!");
      console.log("Error:", err.message || err);
      if (err.logs) {
        console.log("\n📜 Transaction Logs:");
        err.logs.forEach((log: string) => console.log("   ", log));
      }
      process.exit(1);
    }

  } else {
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("STEP 5: UPGRADE ATOMID TEST");
    console.log("═══════════════════════════════════════════════════════════════\n");

    const upgradeBurnAmount = new BN(100_000_000); // 100 ATOM
    const newMetadata = "Upgraded via backend test script";

    console.log("🔥 Upgrading AtomID...");
    console.log("   Current Total:", (existingAtomId.totalBurned.toNumber() / 1_000_000).toLocaleString(), "$ATOM");
    console.log("   Burn Amount:  ", (upgradeBurnAmount.toNumber() / 1_000_000).toLocaleString(), "$ATOM");
    console.log("   New Total:    ", ((existingAtomId.totalBurned.toNumber() + upgradeBurnAmount.toNumber()) / 1_000_000).toLocaleString(), "$ATOM");
    console.log("   New Metadata: ", newMetadata);
    console.log("");

    // For upgrade, we need old and new attestation PDAs
    const oldAttestationPda = pdas.sasAttestationPda;

    // New attestation will use a different derivation (new nonce)
    // For testing, we'll use a timestamp as nonce
    const newNonce = new PublicKey(payer.publicKey.toBuffer()); // Same user, but SAS will handle versioning
    const [newSasAttestationPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("attestation"),
        sasCredential.toBuffer(),
        sasSchema.toBuffer(),
        newNonce.toBuffer(),
      ],
      SAS_PROGRAM_ID
    );

    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: 500_000,
    });

    try {
      const tx = await program.methods
        .upgradeAtomid(upgradeBurnAmount, newMetadata)
        .accountsPartial({
          atomId: pdas.atomIdPda,
          atomConfig: pdas.configPda,
          user: payer.publicKey,
          userTokenAccount,
          atomMint: burnMint,
          oldSasAttestation: oldAttestationPda,
          newSasAttestation: newSasAttestationPda,
          sasCredential,
          sasSchema,
          sasAuthority: pdas.sasAuthorityPda,
          sasEventAuthority: pdas.sasEventAuthorityPda,
          sasProgram: SAS_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .preInstructions([modifyComputeUnits])
        .rpc();

      console.log("✅ UPGRADE ATOMID SUCCESSFUL!");
      console.log("   Transaction:", tx);
      console.log("   View on Solscan: https://solscan.io/tx/" + tx + "?cluster=devnet");
      console.log("");

      // Wait for confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Fetch and display upgraded AtomID
      const upgradedAtomId = await program.account.atomId.fetch(pdas.atomIdPda);
      console.log("📋 Upgraded AtomID Details:");
      console.log("   Owner:        ", upgradedAtomId.owner.toString());
      console.log("   Total Burned: ", upgradedAtomId.totalBurned.toString(), "($" + (upgradedAtomId.totalBurned.toNumber() / 1_000_000).toLocaleString() + " ATOM)");
      console.log("   Rank:         ", upgradedAtomId.rank, "(was:", existingAtomId.rank + ")");
      console.log("   Metadata:     ", upgradedAtomId.metadata);
      console.log("   Updated at:   ", upgradedAtomId.updatedAtSlot.toString());

      // Check new attestation created
      const newAttestationInfo = await connection.getAccountInfo(newSasAttestationPda);
      if (newAttestationInfo) {
        console.log("✅ New attestation created:");
        console.log("   Address:", newSasAttestationPda.toString());
      } else {
        console.log("⚠️  New attestation not found (unexpected)");
      }

    } catch (err: any) {
      console.log("❌ UPGRADE ATOMID FAILED!");
      console.log("Error:", err.message || err);
      if (err.logs) {
        console.log("\n📜 Transaction Logs:");
        err.logs.forEach((log: string) => console.log("   ", log));
      }
      process.exit(1);
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("STEP 6: Final Verification");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Fetch final state
  const finalAtomId = await program.account.atomId.fetch(pdas.atomIdPda);
  const finalTokenAccount = await getAccount(connection, userTokenAccount);

  console.log("✅ Final State:");
  console.log("   AtomID Total Burned:", (finalAtomId.totalBurned.toNumber() / 1_000_000).toLocaleString(), "$ATOM");
  console.log("   AtomID Rank:        ", finalAtomId.rank);
  console.log("   Remaining Balance:  ", (Number(finalTokenAccount.amount) / 1_000_000).toLocaleString(), "$ATOM");
  console.log("");

  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║                   ✅ ALL TESTS PASSED! ✅                     ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("💡 Next: Test from the frontend to verify end-to-end flow");
  console.log("");
}

main()
  .then(() => {
    console.log("✨ Test completed successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Test failed with error:");
    console.error(err);
    process.exit(1);
  });
