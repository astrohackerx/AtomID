import {
  AtomIDClient,
  DEFAULT_ATOMID_PROGRAM_ID,
  DEFAULT_RPC_URL,
  RANK_NAMES,
  RANK_THRESHOLDS,
  calculateRankFromBurned,
  formatAtomAmount,
  getNextRankRequirement,
  getProgressToNextRank,
  getRankEmoji,
  getRankName,
  getRankThreshold,
  shortenAddress,
  validateRank
} from "./chunk-GQBHWRWX.mjs";

// src/gate.ts
function createAtomIDGate(client, config) {
  return async (wallet) => {
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
export {
  AtomIDClient,
  DEFAULT_ATOMID_PROGRAM_ID,
  DEFAULT_RPC_URL,
  RANK_NAMES,
  RANK_THRESHOLDS,
  calculateRankFromBurned,
  createAtomIDGate,
  formatAtomAmount,
  getNextRankRequirement,
  getProgressToNextRank,
  getRankEmoji,
  getRankName,
  getRankThreshold,
  shortenAddress,
  validateRank
};
