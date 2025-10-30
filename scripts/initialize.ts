import * as anchor from "@coral-xyz/anchor";
import { Program, BN, Wallet } from "@coral-xyz/anchor";
import { AtomId } from "../target/types/atom_id";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "fs";

async function main() {
  // const connection = new Connection("https://broken-fittest-wave.solana-mainnet.quiknode.pro/93f43b5d1f507f1468eeafccc4c861ce5e7bbe03/", "confirmed");
  const connection = new Connection("https://broken-fittest-wave.solana-mainnet.quiknode.pro/93f43b5d1f507f1468eeafccc4c861ce5e7bbe03/", "confirmed");
  const walletPath = process.env.HOME + "/.config/solana/id.json";
  const keypairData = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));

  const wallet = new Wallet(keypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const programId = new PublicKey("rnc2fycemiEgj4YbMSuwKFpdV6nkJonojCXib3j2by6");
  const idl = JSON.parse(fs.readFileSync("./target/idl/atom_id.json", "utf-8"));
  const program = new Program(idl, provider) as Program<AtomId>;

  console.log("🔥 Initializing AtomID Protocol on Devnet");
  console.log("Program ID:", program.programId.toString());
  console.log("Admin/Payer:", provider.wallet.publicKey.toString());

  const burnMint = new PublicKey("6KeQaJXFHczWKjrcXdMGKP773JKQmMWDXy4446adpump");
  console.log("$ATOM Mint:", burnMint.toString());

  const minCreateBurn = new BN(1_000_000_000);
  console.log(
    "Min Create Burn:",
    minCreateBurn.toString(),
    "($ATOM with 6 decimals = 1000 ATOM)"
  );

  const rankThresholds = [
    new BN(1_000_000_000),
    new BN(5_000_000_000),
    new BN(10_000_000_000),
    new BN(25_000_000_000),
    new BN(50_000_000_000),
    new BN(100_000_000_000),
    new BN(250_000_000_000),
    new BN(500_000_000_000),
    new BN(1_000_000_000_000),
  ];

  console.log("\n🏆 Rank Thresholds:");
  rankThresholds.forEach((threshold, idx) => {
    console.log(`  Rank ${idx + 1}: ${threshold.toString()} (${threshold.toNumber() / 1_000_000} ATOM)`);
  });

  const [atomConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("atomid_config")],
    program.programId
  );

  console.log("\n📍 Config PDA:", atomConfigPda.toString());

  try {
    const configAccount = await program.account.atomConfig.fetch(atomConfigPda);
    console.log("\n⚠️  Config already initialized!");
    console.log("Current admin:", configAccount.admin.toString());
    console.log("Current min burn:", configAccount.minCreateBurn.toString());
    console.log("Current burn mint:", configAccount.burnMint.toString());
    console.log(
      "\n💡 If you need to update config, use admin_update_config instruction."
    );
    return;
  } catch (err) {
    console.log("\n✅ Config not yet initialized, proceeding...");
  }

  console.log("\n🚀 Sending initialize transaction...");

  // ==========================================
  // IMPORTANT: Update these values after running setup-sas.ts
  // ==========================================
  const sasCredential = new PublicKey("5Ldy7HgzHqmQvX6xQJShzzinmM6yj7bQWLSzAAbUE4Nr");
  const sasSchema = new PublicKey("833nW63cXf3q14uz1otraFknAeMAfw8yFwEPGmAhG8xA");
  const sasAuthority = new PublicKey("8YUtFGXQqUzvbzZMSLZckqfhk5uEaNXLTSbsmWaLmtqF");

  console.log("\n🔗 SAS Integration:");
  console.log("  SAS Credential:", sasCredential.toString());
  console.log("  SAS Schema:", sasSchema.toString());
  console.log("  SAS Authority (PDA):", sasAuthority.toString());

  const tx = await program.methods
    .initialize(
      minCreateBurn,
      rankThresholds,
      burnMint,
      sasCredential,
      sasSchema,
      sasAuthority
    )
    .rpc();

  console.log("\n✅ AtomID Protocol Initialized!");
  console.log("Transaction signature:", tx);
  console.log(
    `View on Solscan: https://solscan.io/tx/${tx}`
  );

  const config = await program.account.atomConfig.fetch(atomConfigPda);
  console.log("\n📋 Initialized Config:");
  console.log("  Admin:", config.admin.toString());
  console.log("  Min Create Burn:", config.minCreateBurn.toString());
  console.log("  Burn Mint:", config.burnMint.toString());
  console.log("  SAS Credential:", config.sasCredential.toString());
  console.log("  SAS Schema:", config.sasSchema.toString());
  console.log("  SAS Authority:", config.sasAuthority.toString());
  console.log("  Rank Thresholds:", config.rankThresholds.map(t => t.toString()));
  console.log("\n🔥 Protocol is ready! Users can now burn $ATOM to create AtomIDs with SAS attestations!");
}

main()
  .then(() => {
    console.log("\n✨ Initialization complete!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Error during initialization:");
    console.error(err);
    process.exit(1);
  });
