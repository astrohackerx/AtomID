import * as anchor from "@coral-xyz/anchor";
import { Program, BN, Wallet, AnchorProvider } from "@coral-xyz/anchor";
import { AtomId } from "../target/types/atom_id";
import {
  getAccount,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { expect } from "chai";
import * as fs from "fs";

describe("atom-id", () => {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  const walletPath = process.env.HOME + "/.config/solana/id.json";
  const keypairData = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));

  const wallet = new Wallet(keypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const programId = new PublicKey("9ntZFb85wU5zng1rM6pTnzbcm9S4s8iTMvhBUYyLZQc1");
  const idl = JSON.parse(fs.readFileSync("./target/idl/atom_id.json", "utf-8"));
  const program = new Program(idl, provider) as Program<AtomId>;

  const atomMint = new PublicKey("DEmAM5nQE5fpAwu3xotx5N19FG6GiDt3e3o6ysDYmaqT");
  let userTokenAccount: PublicKey;
  let configPda: PublicKey;

  before(async () => {
    console.log("Setting up test environment...");
    console.log("Program ID:", program.programId.toString());
    console.log("Wallet:", keypair.publicKey.toString());
    console.log("ATOM Mint:", atomMint.toString());

    [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("atomid_config")],
      program.programId
    );

    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      atomMint,
      keypair.publicKey
    );
    userTokenAccount = tokenAccount.address;

    console.log("User Token Account:", userTokenAccount.toString());
    console.log("Token Balance:", tokenAccount.amount.toString());

    const config = await program.account.atomConfig.fetch(configPda);
    console.log("Config loaded:");
    console.log("  Min Create Burn:", config.minCreateBurn.toString());
    console.log("  Rank Thresholds:", config.rankThresholds.map(t => t.toString()));
  });

  describe("Protocol Status", () => {
    it("verifies config is initialized", async () => {
      const config = await program.account.atomConfig.fetch(configPda);

      expect(config.admin.toString()).to.equal(keypair.publicKey.toString());
      expect(config.burnMint.toString()).to.equal(atomMint.toString());
      expect(config.minCreateBurn.toNumber()).to.be.greaterThan(0);
      expect(config.rankThresholds.length).to.be.greaterThan(0);

      console.log("✅ Protocol config verified");
    });

    it("checks user has sufficient ATOM balance", async () => {
      const account = await getAccount(connection, userTokenAccount);
      const balance = Number(account.amount);

      console.log("User ATOM balance:", balance / 1_000_000, "ATOM");
      expect(balance).to.be.greaterThan(0);
    });
  });

  describe("create_atomid", () => {
    it("creates an AtomID with minimum burn amount", async () => {
      const [atomIdPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("atomid"), keypair.publicKey.toBuffer()],
        program.programId
      );

      try {
        const existingAtomId = await program.account.atomId.fetch(atomIdPda);
        console.log("⚠️  AtomID already exists for this wallet");
        console.log("  Total Burned:", existingAtomId.totalBurned.toString());
        console.log("  Rank:", existingAtomId.rank);
        console.log("  Metadata:", existingAtomId.metadata);

        expect(existingAtomId.owner.toString()).to.equal(keypair.publicKey.toString());
        return;
      } catch (err) {
        console.log("Creating new AtomID...");
      }

      const config = await program.account.atomConfig.fetch(configPda);
      const minBurn = config.minCreateBurn;

      const beforeBalance = await getAccount(connection, userTokenAccount);
      console.log("Balance before:", beforeBalance.amount.toString());

      const tx = await program.methods
        .createAtomid(minBurn, "Test AtomID from devnet")
        .accounts({
          userTokenAccount: userTokenAccount,
          atomMint: atomMint,
        })
        .rpc();

      console.log("✅ AtomID created!");
      console.log("Transaction:", tx);
      console.log(`https://solscan.io/tx/${tx}?cluster=devnet`);

      const atomId = await program.account.atomId.fetch(atomIdPda);
      expect(atomId.owner.toString()).to.equal(keypair.publicKey.toString());
      expect(atomId.totalBurned.toString()).to.equal(minBurn.toString());
      expect(atomId.metadata).to.equal("Test AtomID from devnet");

      const afterBalance = await getAccount(connection, userTokenAccount);
      console.log("Balance after:", afterBalance.amount.toString());
      console.log("Burned:", (Number(beforeBalance.amount) - Number(afterBalance.amount)) / 1_000_000, "ATOM");
    });
  });

  describe("upgrade_atomid", () => {
    it("upgrades existing AtomID", async () => {
      const [atomIdPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("atomid"), keypair.publicKey.toBuffer()],
        program.programId
      );

      const beforeAtomId = await program.account.atomId.fetch(atomIdPda);
      console.log("Before upgrade:");
      console.log("  Total Burned:", beforeAtomId.totalBurned.toString());
      console.log("  Rank:", beforeAtomId.rank);

      const additionalBurn = new BN(1_000_000_000);

      const tx = await program.methods
        .upgradeAtomid(additionalBurn, "Upgraded on devnet")
        .accounts({
          userTokenAccount: userTokenAccount,
          atomMint: atomMint,
        })
        .rpc();

      console.log("✅ AtomID upgraded!");
      console.log("Transaction:", tx);
      console.log(`https://solscan.io/tx/${tx}?cluster=devnet`);

      const afterAtomId = await program.account.atomId.fetch(atomIdPda);
      console.log("After upgrade:");
      console.log("  Total Burned:", afterAtomId.totalBurned.toString());
      console.log("  Rank:", afterAtomId.rank);
      console.log("  Metadata:", afterAtomId.metadata);

      expect(afterAtomId.totalBurned.gt(beforeAtomId.totalBurned)).to.be.true;
    });
  });

  describe("update_metadata", () => {
    it("updates AtomID metadata", async () => {
      const [atomIdPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("atomid"), keypair.publicKey.toBuffer()],
        program.programId
      );

      const newMetadata = `Updated at ${Date.now()}`;

      const tx = await program.methods
        .updateMetadata(newMetadata)
        .rpc();

      console.log("✅ Metadata updated!");
      console.log("Transaction:", tx);
      console.log(`https://solscan.io/tx/${tx}?cluster=devnet`);

      const atomId = await program.account.atomId.fetch(atomIdPda);
      console.log("New metadata:", atomId.metadata);

      expect(atomId.metadata).to.equal(newMetadata);
    });
  });

  describe("read_atomid", () => {
    it("reads AtomID by owner", async () => {
      const [atomIdPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("atomid"), keypair.publicKey.toBuffer()],
        program.programId
      );

      const atomId = await program.account.atomId.fetch(atomIdPda);

      console.log("📋 Current AtomID:");
      console.log("  Owner:", atomId.owner.toString());
      console.log("  Total Burned:", atomId.totalBurned.toString(), `(${atomId.totalBurned.toNumber() / 1_000_000} ATOM)`);
      console.log("  Rank:", atomId.rank);
      console.log("  Metadata:", atomId.metadata);
      console.log("  Created At Slot:", atomId.createdAtSlot.toString());
      console.log("  Updated At Slot:", atomId.updatedAtSlot.toString());

      expect(atomId.owner.toString()).to.equal(keypair.publicKey.toString());
    });
  });
});
