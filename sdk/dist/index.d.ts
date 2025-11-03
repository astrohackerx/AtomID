import { A as AtomIDRank, a as AtomIDClient, R as RankRequirement } from './client-CP0vUS-d.js';
export { b as AtomIDAccount, c as AtomIDConfig, D as DEFAULT_ATOMID_PROGRAM_ID, f as DEFAULT_RPC_URL, d as RANK_NAMES, e as RANK_THRESHOLDS, V as VerificationResult } from './client-CP0vUS-d.js';
import { PublicKey } from '@solana/web3.js';

declare function getRankName(rank: AtomIDRank): string;
declare function getRankThreshold(rank: AtomIDRank): bigint;
declare function calculateRankFromBurned(burned: bigint): AtomIDRank;
declare function getNextRankRequirement(currentRank: AtomIDRank): {
    nextRank: AtomIDRank | null;
    atomsRequired: bigint;
};
declare function getProgressToNextRank(currentBurned: bigint, currentRank: AtomIDRank): {
    percentage: number;
    atomsNeeded: bigint;
    nextRank: AtomIDRank | null;
};
declare function formatAtomAmount(amount: bigint): string;
declare function getRankEmoji(rank: AtomIDRank): string;
declare function validateRank(rank: number): rank is AtomIDRank;
declare function shortenAddress(address: string, chars?: number): string;

interface GateConfig {
    requirement: RankRequirement;
    onSuccess?: () => void;
    onFailure?: (rank: AtomIDRank) => void;
}
declare function createAtomIDGate(client: AtomIDClient, config: GateConfig): (wallet: PublicKey | string) => Promise<boolean>;

export { AtomIDClient, AtomIDRank, RankRequirement, calculateRankFromBurned, createAtomIDGate, formatAtomAmount, getNextRankRequirement, getProgressToNextRank, getRankEmoji, getRankName, getRankThreshold, shortenAddress, validateRank };
