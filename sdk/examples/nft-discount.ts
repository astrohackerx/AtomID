/**
 * Example: NFT mint with rank-based discounts
 * Run: npx ts-node examples/nft-discount.ts
 */

import { AtomIDClient, getRankName, getRankEmoji } from "atomid-sdk";
import { PublicKey, Connection } from "@solana/web3.js";

async function calculatePrice(rank: number, basePrice: number): Promise<number> {
  const discount = Math.min(rank * 0.1, 0.5);
  return basePrice * (1 - discount);
}

async function main() {
  const client = new AtomIDClient({
    connection: new Connection("https://api.mainnet-beta.solana.com")
  });

  const walletAddress = process.argv[2];
  const basePrice = 1.0;

  if (!walletAddress) {
    console.log("Usage: npx ts-node examples/nft-discount.ts <WALLET_ADDRESS>\n");
    console.log("Example:");
    console.log("  npx ts-node examples/nft-discount.ts 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU\n");
    process.exit(1);
  }

  const wallet = new PublicKey(walletAddress);

  console.log("\n🎨 NFT Mint Price Calculator\n");
  console.log("═══════════════════════════════════════\n");

  const result = await client.verify(wallet);

  if (result.exists && result.account) {
    const { rank } = result.account;
    const discount = Math.min(rank * 10, 50);
    const finalPrice = await calculatePrice(rank, basePrice);
    const savings = basePrice - finalPrice;

    console.log(`Wallet:       ${wallet.toBase58()}`);
    console.log(`Rank:         ${getRankEmoji(rank)} ${rank} - ${getRankName(rank)}`);
    console.log(`\nBase Price:   ${basePrice} SOL`);
    console.log(`Discount:     ${discount}% off`);
    console.log(`Final Price:  ${finalPrice.toFixed(2)} SOL`);
    console.log(`You Save:     ${savings.toFixed(2)} SOL\n`);

    console.log("═══════════════════════════════════════\n");

    if (rank >= 7) {
      console.log("🌟 VIP STATUS: You also get early access!");
    } else if (rank >= 5) {
      console.log("⭐ Great discount! Burn more ATOM for VIP perks.");
    } else if (rank >= 3) {
      console.log("💡 Good discount! Rank up for bigger savings.");
    } else {
      console.log("🔥 Burn more ATOM to unlock bigger discounts!");
    }

  } else {
    console.log(`Wallet:       ${wallet.toBase58()}`);
    console.log(`Rank:         0 - No AtomID`);
    console.log(`\nBase Price:   ${basePrice} SOL`);
    console.log(`Discount:     0% off`);
    console.log(`Final Price:  ${basePrice} SOL\n`);
    console.log("═══════════════════════════════════════\n");
    console.log("💡 Burn ATOM tokens to get a discount!");
  }

  console.log();
}

main().catch(console.error);
