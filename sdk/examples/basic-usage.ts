/**
 * Basic AtomID SDK Usage Examples
 *
 * IMPORTANT: Set your RPC endpoint in environment variable SOLANA_RPC_URL
 * Get a free RPC from: Helius, QuickNode, or Alchemy
 */

import { AtomIDClient, getRankName, getRankEmoji, formatAtomAmount } from "atomid-sdk";
import { PublicKey } from "@solana/web3.js";

// Initialize client with custom RPC endpoint
const client = new AtomIDClient({
  rpcUrl: process.env.SOLANA_RPC_URL || "YOUR_RPC_URL_HERE"
});

async function example1_verifyWallet() {
  console.log("=== Example 1: Verify a Wallet ===\n");

  const wallet = new PublicKey("YOUR_WALLET_ADDRESS_HERE");

  const result = await client.verify(wallet);

  if (result.exists && result.account) {
    console.log("✅ AtomID found!");
    console.log(`Rank: ${result.account.rank} (${getRankName(result.account.rank)})`);
    console.log(`Emoji: ${getRankEmoji(result.account.rank)}`);
    console.log(`Total Burned: ${formatAtomAmount(result.account.totalBurned)} ATOM`);
    console.log(`Created at slot: ${result.account.createdAtSlot}`);
  } else {
    console.log("❌ No AtomID found for this wallet");
  }
}

async function example2_checkAccess() {
  console.log("\n=== Example 2: Gate Access by Rank ===\n");

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

  const top10 = await client.getLeaderboard(10);

  console.log("🏆 Top 10 AtomID Holders:\n");

  top10.forEach((account, i) => {
    console.log(`${i + 1}. ${getRankEmoji(account.rank)} ${getRankName(account.rank)} (Rank ${account.rank})`);
    console.log(`   Wallet: ${account.wallet.toBase58().slice(0, 8)}...`);
    console.log(`   Burned: ${formatAtomAmount(account.totalBurned)} ATOM\n`);
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
