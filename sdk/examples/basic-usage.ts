/**
 * Basic AtomID SDK Usage Examples
 */

import { AtomIDClient, getRankName, getRankEmoji } from "atomid-sdk";
import { PublicKey } from "@solana/web3.js";

async function example1_verifyWallet() {
  console.log("=== Example 1: Verify a Wallet ===\n");

  const client = new AtomIDClient();
  const wallet = new PublicKey("YOUR_WALLET_ADDRESS_HERE");

  const result = await client.verify(wallet);

  if (result.exists && result.account) {
    console.log("✅ AtomID found!");
    console.log(`Rank: ${result.account.rank} (${getRankName(result.account.rank)})`);
    console.log(`Emoji: ${getRankEmoji(result.account.rank)}`);
    console.log(`Total Burned: ${result.account.totalBurned.toString()} ATOM`);
    console.log(`Created: ${result.account.createdAt.toLocaleDateString()}`);
  } else {
    console.log("❌ No AtomID found for this wallet");
  }
}

async function example2_checkAccess() {
  console.log("\n=== Example 2: Gate Access by Rank ===\n");

  const client = new AtomIDClient();
  const wallet = new PublicKey("YOUR_WALLET_ADDRESS_HERE");

  const hasAccess = await client.hasMinimumRank(wallet, 5);

  if (hasAccess) {
    console.log("✅ Access granted! User is Oracle rank or higher");
    // Grant access to premium feature
  } else {
    const currentRank = await client.getRank(wallet);
    console.log(`❌ Access denied. User is rank ${currentRank}, needs rank 5`);
    // Show upgrade prompt
  }
}

async function example3_tieredPricing() {
  console.log("\n=== Example 3: Tiered Pricing Based on Rank ===\n");

  const client = new AtomIDClient();
  const wallet = new PublicKey("YOUR_WALLET_ADDRESS_HERE");

  const rank = await client.getRank(wallet);
  const basePrice = 100; // $100 base price

  const discount = rank * 0.1; // 10% off per rank
  const finalPrice = basePrice * (1 - discount);

  console.log(`Base Price: $${basePrice}`);
  console.log(`Your Rank: ${rank} (${getRankName(rank)})`);
  console.log(`Discount: ${(discount * 100).toFixed(0)}%`);
  console.log(`Final Price: $${finalPrice.toFixed(2)}`);
  console.log(`You save: $${(basePrice - finalPrice).toFixed(2)}`);
}

async function example4_batchVerification() {
  console.log("\n=== Example 4: Verify Multiple Wallets ===\n");

  const client = new AtomIDClient();

  const wallets = [
    "WALLET_1_HERE",
    "WALLET_2_HERE",
    "WALLET_3_HERE"
  ].map(addr => new PublicKey(addr));

  const results = await client.verifyBatch(wallets);

  results.forEach((result, i) => {
    if (result.exists && result.account) {
      console.log(`Wallet ${i + 1}: Rank ${result.account.rank} - ${getRankName(result.account.rank)}`);
    } else {
      console.log(`Wallet ${i + 1}: No AtomID`);
    }
  });
}

async function example5_leaderboard() {
  console.log("\n=== Example 5: Get Top Believers ===\n");

  const client = new AtomIDClient();

  const top10 = await client.getLeaderboard(10);

  console.log("🏆 Top 10 AtomID Holders:\n");

  top10.forEach((account, i) => {
    console.log(`${i + 1}. ${getRankEmoji(account.rank)} ${getRankName(account.rank)} (Rank ${account.rank})`);
    console.log(`   Wallet: ${account.wallet.toBase58().slice(0, 8)}...`);
    console.log(`   Burned: ${account.totalBurned.toString()} ATOM\n`);
  });
}

async function runAllExamples() {
  await example1_verifyWallet();
  await example2_checkAccess();
  await example3_tieredPricing();
  await example4_batchVerification();
  await example5_leaderboard();
}

runAllExamples().catch(console.error);
