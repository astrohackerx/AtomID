/**
 * Quick example: Verify a wallet's AtomID
 * Run: npx ts-node examples/verify-wallet.ts
 */

import { AtomIDClient, getRankName, getRankEmoji, formatAtomAmount } from "atomid-sdk";
import { PublicKey, Connection } from "@solana/web3.js";

async function main() {
  console.log("🔍 AtomID Verification Example\n");

  const client = new AtomIDClient({
    connection: new Connection("https://api.mainnet-beta.solana.com")
  });

  const walletAddress = process.argv[2];

  if (!walletAddress) {
    console.log("Usage: npx ts-node examples/verify-wallet.ts <WALLET_ADDRESS>");
    console.log("\nExample:");
    console.log("  npx ts-node examples/verify-wallet.ts 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU\n");
    process.exit(1);
  }

  try {
    const wallet = new PublicKey(walletAddress);
    console.log(`Checking: ${wallet.toBase58()}\n`);

    const result = await client.verify(wallet);

    if (result.exists && result.account) {
      const { rank, totalBurned, createdAt } = result.account;

      console.log("✅ AtomID Found!\n");
      console.log("═══════════════════════════════════");
      console.log(`  Rank:         ${getRankEmoji(rank)} ${rank} - ${getRankName(rank)}`);
      console.log(`  Total Burned: ${formatAtomAmount(totalBurned)} ATOM`);
      console.log(`  Created:      ${createdAt.toLocaleDateString()}`);
      console.log("═══════════════════════════════════\n");

      if (rank >= 5) {
        console.log("🎉 This wallet qualifies for premium features!");
      } else if (rank >= 3) {
        console.log("⭐ This wallet has moderate commitment");
      } else {
        console.log("🌱 This wallet is just getting started");
      }
    } else {
      console.log("❌ No AtomID found for this wallet");
      console.log("\nThis wallet has not burned any ATOM tokens yet.");
    }

  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
  }
}

main();
