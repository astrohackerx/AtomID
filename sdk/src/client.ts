import { Connection, PublicKey } from "@solana/web3.js";
import {
  AtomIDAccount,
  AtomIDConfig,
  AtomIDRank,
  DEFAULT_ATOMID_PROGRAM_ID,
  DEFAULT_RPC_URL,
  RankRequirement,
  VerificationResult
} from "./types";

export class AtomIDClient {
  private connection: Connection;
  private programId: PublicKey;
  private cache: Map<string, { data: AtomIDAccount; expiresAt: number }>;
  private cacheTTL: number;

  constructor(config: AtomIDConfig = {}) {
    this.connection = new Connection(
      config.rpcUrl || DEFAULT_RPC_URL,
      "confirmed"
    );
    this.programId = new PublicKey(
      config.programId || DEFAULT_ATOMID_PROGRAM_ID
    );
    this.cache = new Map();
    this.cacheTTL = config.cacheTTL || 300000; // 5 minutes default
  }

  private findAtomIDPDA(wallet: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("atomid"), wallet.toBuffer()],
      this.programId
    );
  }

  private parseAtomIDAccount(
    data: Buffer,
    wallet: PublicKey,
    pda: PublicKey
  ): AtomIDAccount {
    const rank = data[73] as AtomIDRank;
    const totalBurned = data.readBigUInt64LE(41);
    const atomsMinted = data.readBigUInt64LE(49);
    const createdAtTimestamp = Number(data.readBigUInt64LE(57));
    const lastBurnedAtTimestamp = Number(data.readBigUInt64LE(65));

    return {
      wallet,
      rank,
      totalBurned,
      atomsMinted,
      createdAt: new Date(createdAtTimestamp * 1000),
      lastBurnedAt: new Date(lastBurnedAtTimestamp * 1000),
      pda
    };
  }

  async verify(wallet: PublicKey | string): Promise<VerificationResult> {
    try {
      const walletPubkey = typeof wallet === "string" ? new PublicKey(wallet) : wallet;
      const cacheKey = walletPubkey.toBase58();

      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return {
          exists: true,
          account: cached.data
        };
      }

      const [pda] = this.findAtomIDPDA(walletPubkey);
      const accountInfo = await this.connection.getAccountInfo(pda);

      if (!accountInfo) {
        return {
          exists: false,
          account: null
        };
      }

      const account = this.parseAtomIDAccount(
        accountInfo.data,
        walletPubkey,
        pda
      );

      this.cache.set(cacheKey, {
        data: account,
        expiresAt: Date.now() + this.cacheTTL
      });

      return {
        exists: true,
        account
      };
    } catch (error) {
      return {
        exists: false,
        account: null,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async getRank(wallet: PublicKey | string): Promise<AtomIDRank> {
    const result = await this.verify(wallet);
    return result.account?.rank ?? 0;
  }

  async hasMinimumRank(
    wallet: PublicKey | string,
    minRank: AtomIDRank
  ): Promise<boolean> {
    const rank = await this.getRank(wallet);
    return rank >= minRank;
  }

  async checkRequirement(
    wallet: PublicKey | string,
    requirement: RankRequirement
  ): Promise<boolean> {
    const rank = await this.getRank(wallet);

    if (rank < requirement.minRank) {
      return false;
    }

    if (requirement.maxRank !== undefined && rank > requirement.maxRank) {
      return false;
    }

    return true;
  }

  async verifyBatch(wallets: (PublicKey | string)[]): Promise<VerificationResult[]> {
    return Promise.all(wallets.map(wallet => this.verify(wallet)));
  }

  clearCache(): void {
    this.cache.clear();
  }

  async getLeaderboard(limit: number = 100): Promise<AtomIDAccount[]> {
    const programAccounts = await this.connection.getProgramAccounts(
      this.programId,
      {
        filters: [
          {
            dataSize: 74
          }
        ]
      }
    );

    const accounts = programAccounts.map(({ pubkey, account }) => {
      const walletBytes = account.data.slice(8, 40);
      const wallet = new PublicKey(walletBytes);
      return this.parseAtomIDAccount(account.data, wallet, pubkey);
    });

    accounts.sort((a, b) => {
      if (a.rank !== b.rank) {
        return b.rank - a.rank;
      }
      return Number(b.totalBurned - a.totalBurned);
    });

    return accounts.slice(0, limit);
  }

  getConnection(): Connection {
    return this.connection;
  }

  getProgramId(): PublicKey {
    return this.programId;
  }
}
