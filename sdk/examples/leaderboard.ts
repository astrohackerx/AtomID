/**
 * Example: Display the top AtomID holders
 * Run: npx ts-node examples/leaderboard.ts
 */

import { AtomIDClient, getRankName, getRankEmoji, formatAtomAmount } from "atomid-sdk";
import { Connection } from "@solana/web3.js";

async function main() {
  const client = new AtomIDClient({
    connection: new Connection("https://api.mainnet-beta.solana.com")
  });

  const limit = parseInt(process.argv[2]) || 10;

  console.log(`\n🏆 Top ${limit} AtomID Believers\n`);
  console.log("═══════════════════════════════════════════════════════════════\n");

  const leaderboard = await client.getLeaderboard(limit);

  if (leaderboard.length === 0) {
    console.log("No AtomID holders found yet.\n");
    return;
  }

  leaderboard.forEach((account, index) => {
    const position = `#${(index + 1).toString().padStart(2, "0")}`;
    const emoji = getRankEmoji(account.rank);
    const rankName = getRankName(account.rank).padEnd(10);
    const burned = formatAtomAmount(account.totalBurned).padStart(15);
    const walletShort = account.wallet.toBase58().slice(0, 8);

    console.log(`${position} ${emoji} ${rankName} | ${burned} ATOM | ${walletShort}...`);
  });

  console.log("\n═══════════════════════════════════════════════════════════════\n");

  const totalBurned = leaderboard.reduce((sum, acc) => sum + acc.totalBurned, BigInt(0));
  console.log(`Total ATOM burned by top ${limit}: ${formatAtomAmount(totalBurned)}\n`);
}

main().catch(console.error);
