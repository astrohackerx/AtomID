import { PublicKey } from "@solana/web3.js";

export type AtomIDRank = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface AtomIDAccount {
  wallet: PublicKey;
  rank: AtomIDRank;
  totalBurned: bigint;
  createdAtSlot: number;
  updatedAtSlot: number;
  pda: PublicKey;
}

export interface VerificationResult {
  exists: boolean;
  account: AtomIDAccount | null;
  error?: string;
}

export interface RankRequirement {
  minRank: AtomIDRank;
  maxRank?: AtomIDRank;
}

export interface AtomIDConfig {
  rpcUrl?: string;
  programId?: string;
  cacheTTL?: number;
}

export const RANK_NAMES: Record<AtomIDRank, string> = {
  0: "Initiate",
  1: "Believer",
  2: "Devotee",
  3: "Guardian",
  4: "Keeper",
  5: "Oracle",
  6: "Architect",
  7: "Sage",
  8: "Ascended",
  9: "Eternal"
};

export const ATOM_DECIMALS = 6;
export const DECIMALS_MULTIPLIER = BigInt(10 ** ATOM_DECIMALS);

export const RANK_THRESHOLDS: Record<AtomIDRank, bigint> = {
  0: BigInt(0),
  1: BigInt(1000) * DECIMALS_MULTIPLIER,
  2: BigInt(5000) * DECIMALS_MULTIPLIER,
  3: BigInt(10000) * DECIMALS_MULTIPLIER,
  4: BigInt(25000) * DECIMALS_MULTIPLIER,
  5: BigInt(50000) * DECIMALS_MULTIPLIER,
  6: BigInt(100000) * DECIMALS_MULTIPLIER,
  7: BigInt(250000) * DECIMALS_MULTIPLIER,
  8: BigInt(500000) * DECIMALS_MULTIPLIER,
  9: BigInt(1000000) * DECIMALS_MULTIPLIER
};

export const DEFAULT_ATOMID_PROGRAM_ID = "rnc2fycemiEgj4YbMSuwKFpdV6nkJonojCXib3j2by6";
export const DEFAULT_RPC_URL = "https://api.mainnet-beta.solana.com";
