import { PublicKey, Connection } from '@solana/web3.js';

type AtomIDRank = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
interface AtomIDAccount {
    wallet: PublicKey;
    rank: AtomIDRank;
    totalBurned: bigint;
    atomsMinted: bigint;
    createdAt: Date;
    lastBurnedAt: Date;
    pda: PublicKey;
}
interface VerificationResult {
    exists: boolean;
    account: AtomIDAccount | null;
    error?: string;
}
interface RankRequirement {
    minRank: AtomIDRank;
    maxRank?: AtomIDRank;
}
interface AtomIDConfig {
    rpcUrl?: string;
    programId?: string;
    cacheTTL?: number;
}
declare const RANK_NAMES: Record<AtomIDRank, string>;
declare const RANK_THRESHOLDS: Record<AtomIDRank, bigint>;
declare const DEFAULT_ATOMID_PROGRAM_ID = "rnc2fycemiEgj4YbMSuwKFpdV6nkJonojCXib3j2by6";
declare const DEFAULT_RPC_URL = "https://api.mainnet-beta.solana.com";

declare class AtomIDClient {
    private connection;
    private programId;
    private cache;
    private cacheTTL;
    constructor(config?: AtomIDConfig);
    private findAtomIDPDA;
    private parseAtomIDAccount;
    verify(wallet: PublicKey | string): Promise<VerificationResult>;
    getRank(wallet: PublicKey | string): Promise<AtomIDRank>;
    hasMinimumRank(wallet: PublicKey | string, minRank: AtomIDRank): Promise<boolean>;
    checkRequirement(wallet: PublicKey | string, requirement: RankRequirement): Promise<boolean>;
    verifyBatch(wallets: (PublicKey | string)[]): Promise<VerificationResult[]>;
    clearCache(): void;
    getLeaderboard(limit?: number): Promise<AtomIDAccount[]>;
    getConnection(): Connection;
    getProgramId(): PublicKey;
}

export { type AtomIDRank as A, DEFAULT_ATOMID_PROGRAM_ID as D, type RankRequirement as R, type VerificationResult as V, AtomIDClient as a, type AtomIDAccount as b, type AtomIDConfig as c, RANK_NAMES as d, RANK_THRESHOLDS as e, DEFAULT_RPC_URL as f };
