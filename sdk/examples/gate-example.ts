/**
 * Example: Gate access to features based on rank
 * Run: npx ts-node examples/gate-example.ts
 */

import { AtomIDClient, getRankName } from "atomid-sdk";
import { PublicKey, Connection } from "@solana/web3.js";

async function main() {
  const client = new AtomIDClient({
    connection: new Connection("https://api.mainnet-beta.solana.com")
  });

  const walletAddress = process.argv[2];

  if (!walletAddress) {
    console.log("Usage: npx ts-node examples/gate-example.ts <WALLET_ADDRESS>\n");
    process.exit(1);
  }

  const wallet = new PublicKey(walletAddress);
  console.log(`🔐 Checking access for: ${wallet.toBase58()}\n`);

  const features = [
    { name: "Basic Features", minRank: 1 },
    { name: "Premium NFT Mint", minRank: 3 },
    { name: "Early Access", minRank: 5 },
    { name: "Exclusive Community", minRank: 7 },
    { name: "Legendary Status", minRank: 9 }
  ];

  const rank = await client.getRank(wallet);
  console.log(`Your Rank: ${rank} (${getRankName(rank)})\n`);
  console.log("═══════════════════════════════════════\n");

  for (const feature of features) {
    const hasAccess = await client.hasMinimumRank(wallet, feature.minRank);
    const status = hasAccess ? "✅ UNLOCKED" : "🔒 LOCKED";
    const required = hasAccess ? "" : ` (need rank ${feature.minRank})`;

    console.log(`${status} ${feature.name}${required}`);
  }

  console.log("\n═══════════════════════════════════════\n");

  if (rank < 5) {
    console.log(`💡 Burn more ATOM to unlock premium features!`);
  } else {
    console.log(`🎉 You have premium access!`);
  }
}

main().catch(console.error);
