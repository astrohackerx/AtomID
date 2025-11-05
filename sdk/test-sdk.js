#!/usr/bin/env node
/**
 * Test script to verify SDK fixes before publishing
 * Usage: node test-sdk.js <WALLET_ADDRESS>
 * Or: npm test <WALLET_ADDRESS>
 *
 * IMPORTANT: Run `npm run build` first to compile the SDK
 */

const { AtomIDClient, formatAtomAmount, getRankName, getRankEmoji, rawToHumanReadable, ATOM_DECIMALS, DECIMALS_MULTIPLIER } = require("./dist/index.js");
const { PublicKey } = require("@solana/web3.js");

async function main() {
  console.log("\n🧪 AtomID SDK Test Script");
  console.log("================================\n");

  const walletAddress = process.argv[2];

  if (!walletAddress) {
    console.log("❌ Error: No wallet address provided\n");
    console.log("Usage: node test-sdk.js <WALLET_ADDRESS>\n");
    console.log("Or: npm test <WALLET_ADDRESS>\n");
    console.log("Example:");
    console.log("  node sdk/test-sdk.js 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU\n");
    process.exit(1);
  }

  // Display SDK configuration
  console.log("📋 SDK Configuration:");
  console.log(`   ATOM Decimals: ${ATOM_DECIMALS}`);
  console.log(`   Decimals Multiplier: ${DECIMALS_MULTIPLIER.toString()}`);
  console.log("");

  // Initialize client
  const client = new AtomIDClient({
    rpcUrl: "https://api.mainnet-beta.solana.com"
  });

  try {
    const wallet = new PublicKey(walletAddress);
    console.log(`🔍 Checking wallet: ${wallet.toBase58()}\n`);

    // Verify the wallet
    const result = await client.verify(wallet);

    if (result.exists && result.account) {
      const { rank, totalBurned, createdAtSlot, updatedAtSlot, pda } = result.account;

      console.log("✅ AtomID Found!\n");
      console.log("═══════════════════════════════════════════════════════════");

      // Rank information
      console.log("\n📊 Rank Information:");
      console.log(`   Emoji: ${getRankEmoji(rank)}`);
      console.log(`   Rank: ${rank}`);
      console.log(`   Name: ${getRankName(rank)}`);

      // Burn information
      console.log("\n🔥 Burn Information:");
      console.log(`   Raw Value: ${totalBurned.toString()}`);
      console.log(`   Human Readable: ${rawToHumanReadable(totalBurned)}`);
      console.log(`   Formatted: ${formatAtomAmount(totalBurned)} ATOM`);

      // Slot information
      console.log("\n📅 Slot Information:");
      console.log(`   Created at slot: ${createdAtSlot}`);
      console.log(`   Last updated at slot: ${updatedAtSlot}`);

      // PDA information
      console.log("\n🔑 Account Information:");
      console.log(`   PDA: ${pda.toBase58()}`);
      console.log(`   Owner: ${wallet.toBase58()}`);

      console.log("\n═══════════════════════════════════════════════════════════");

      // Test rank-based features
      console.log("\n🎯 Feature Access Test:");
      const features = [
        { name: "Basic Features", minRank: 0 },
        { name: "Premium Features", minRank: 3 },
        { name: "VIP Features", minRank: 5 },
        { name: "Elite Features", minRank: 7 },
        { name: "Legendary Features", minRank: 9 }
      ];

      for (const feature of features) {
        const hasAccess = await client.hasMinimumRank(wallet, feature.minRank);
        const status = hasAccess ? "✅ Unlocked" : "🔒 Locked";
        console.log(`   ${status} ${feature.name} (Rank ${feature.minRank}+)`);
      }

      // Test leaderboard
      console.log("\n🏆 Leaderboard Position:");
      const leaderboard = await client.getLeaderboard(100);
      const position = leaderboard.findIndex(acc => acc.wallet.equals(wallet)) + 1;

      if (position > 0) {
        console.log(`   Position: #${position} out of ${leaderboard.length}`);
      } else {
        console.log(`   Not in top ${leaderboard.length}`);
      }

      console.log("\n✅ All tests passed! SDK is working correctly.\n");

    } else {
      console.log("❌ No AtomID found for this wallet\n");
      console.log("This wallet has not burned any ATOM tokens yet.");
      console.log("To create an AtomID, visit: https://lostatom.org\n");

      if (result.error) {
        console.log(`Error details: ${result.error}\n`);
      }
    }

  } catch (error) {
    console.error("\n❌ Error during verification:");
    console.error(error instanceof Error ? error.message : error);
    console.error("\nStack trace:");
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("🎉 Test completed successfully!\n");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n💥 Fatal error:");
    console.error(err);
    process.exit(1);
  });
