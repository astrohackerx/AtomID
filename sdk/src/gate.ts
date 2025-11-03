import { PublicKey } from "@solana/web3.js";
import { AtomIDClient } from "./client";
import { AtomIDRank, RankRequirement } from "./types";

export interface GateConfig {
  requirement: RankRequirement;
  onSuccess?: () => void;
  onFailure?: (rank: AtomIDRank) => void;
}

export function createAtomIDGate(client: AtomIDClient, config: GateConfig) {
  return async (wallet: PublicKey | string): Promise<boolean> => {
    try {
      const meetsRequirement = await client.checkRequirement(
        wallet,
        config.requirement
      );

      if (meetsRequirement) {
        config.onSuccess?.();
        return true;
      } else {
        const rank = await client.getRank(wallet);
        config.onFailure?.(rank);
        return false;
      }
    } catch (error) {
      console.error("AtomID gate error:", error);
      return false;
    }
  };
}

export async function requireMinRank(
  client: AtomIDClient,
  wallet: PublicKey | string,
  minRank: AtomIDRank
): Promise<void> {
  const hasRank = await client.hasMinimumRank(wallet, minRank);

  if (!hasRank) {
    const currentRank = await client.getRank(wallet);
    throw new Error(
      `Insufficient AtomID rank. Required: ${minRank}, Current: ${currentRank}`
    );
  }
}

export async function gateByRank<T>(
  client: AtomIDClient,
  wallet: PublicKey | string,
  minRank: AtomIDRank,
  action: () => Promise<T>
): Promise<T> {
  await requireMinRank(client, wallet, minRank);
  return action();
}
