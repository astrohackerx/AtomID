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
    // Struct layout:
    // 0-7: discriminator
    // 8-39: owner (32 bytes)
    // 40-47: total_burned (u64)
    // 48: rank (u8)
    // 49-52: metadata length (u32)
    // 53+: metadata string (variable length)
    // after metadata: created_at_slot (u64)
    // after that: updated_at_slot (u64)
    // after that: bump (u8)

    const totalBurned = data.readBigUInt64LE(40);
    const rank = data[48] as AtomIDRank;
    const metadataLength = data.readUInt32LE(49);

    // Calculate offset after variable-length metadata
    const afterMetadata = 53 + metadataLength;
    const createdAtSlot = Number(data.readBigUInt64LE(afterMetadata));
    const updatedAtSlot = Number(data.readBigUInt64LE(afterMetadata + 8));

    return {
      wallet,
      rank,
      totalBurned,
      createdAtSlot,
      updatedAtSlot,
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
      this.programId
    );

    // Filter to only AtomID accounts (discriminator: 609742dc4dd3839a)
    const atomIdDiscriminator = Buffer.from('609742dc4dd3839a', 'hex');

    const accounts = programAccounts
      .filter(({ account }) => {
        return account.data.slice(0, 8).equals(atomIdDiscriminator);
      })
      .map(({ pubkey, account }) => {
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
