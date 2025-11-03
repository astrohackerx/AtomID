// src/types.ts
var RANK_NAMES = {
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
var RANK_THRESHOLDS = {
  0: BigInt(0),
  1: BigInt(1e3),
  2: BigInt(5e3),
  3: BigInt(1e4),
  4: BigInt(25e3),
  5: BigInt(5e4),
  6: BigInt(1e5),
  7: BigInt(25e4),
  8: BigInt(5e5),
  9: BigInt(1e6)
};
var DEFAULT_ATOMID_PROGRAM_ID = "rnc2fycemiEgj4YbMSuwKFpdV6nkJonojCXib3j2by6";
var DEFAULT_RPC_URL = "https://api.mainnet-beta.solana.com";

// src/client.ts
import { Connection, PublicKey } from "@solana/web3.js";
var AtomIDClient = class {
  constructor(config = {}) {
    this.connection = new Connection(
      config.rpcUrl || DEFAULT_RPC_URL,
      "confirmed"
    );
    this.programId = new PublicKey(
      config.programId || DEFAULT_ATOMID_PROGRAM_ID
    );
    this.cache = /* @__PURE__ */ new Map();
    this.cacheTTL = config.cacheTTL || 3e5;
  }
  findAtomIDPDA(wallet) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("atomid"), wallet.toBuffer()],
      this.programId
    );
  }
  parseAtomIDAccount(data, wallet, pda) {
    const rank = data[73];
    const totalBurned = data.readBigUInt64LE(41);
    const atomsMinted = data.readBigUInt64LE(49);
    const createdAtTimestamp = Number(data.readBigUInt64LE(57));
    const lastBurnedAtTimestamp = Number(data.readBigUInt64LE(65));
    return {
      wallet,
      rank,
      totalBurned,
      atomsMinted,
      createdAt: new Date(createdAtTimestamp * 1e3),
      lastBurnedAt: new Date(lastBurnedAtTimestamp * 1e3),
      pda
    };
  }
  async verify(wallet) {
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
  async getRank(wallet) {
    const result = await this.verify(wallet);
    return result.account?.rank ?? 0;
  }
  async hasMinimumRank(wallet, minRank) {
    const rank = await this.getRank(wallet);
    return rank >= minRank;
  }
  async checkRequirement(wallet, requirement) {
    const rank = await this.getRank(wallet);
    if (rank < requirement.minRank) {
      return false;
    }
    if (requirement.maxRank !== void 0 && rank > requirement.maxRank) {
      return false;
    }
    return true;
  }
  async verifyBatch(wallets) {
    return Promise.all(wallets.map((wallet) => this.verify(wallet)));
  }
  clearCache() {
    this.cache.clear();
  }
  async getLeaderboard(limit = 100) {
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
  getConnection() {
    return this.connection;
  }
  getProgramId() {
    return this.programId;
  }
};

// src/utils.ts
function getRankName(rank) {
  return RANK_NAMES[rank];
}
function getRankThreshold(rank) {
  return RANK_THRESHOLDS[rank];
}
function calculateRankFromBurned(burned) {
  if (burned >= RANK_THRESHOLDS[9]) return 9;
  if (burned >= RANK_THRESHOLDS[8]) return 8;
  if (burned >= RANK_THRESHOLDS[7]) return 7;
  if (burned >= RANK_THRESHOLDS[6]) return 6;
  if (burned >= RANK_THRESHOLDS[5]) return 5;
  if (burned >= RANK_THRESHOLDS[4]) return 4;
  if (burned >= RANK_THRESHOLDS[3]) return 3;
  if (burned >= RANK_THRESHOLDS[2]) return 2;
  if (burned >= RANK_THRESHOLDS[1]) return 1;
  return 0;
}
function getNextRankRequirement(currentRank) {
  if (currentRank === 9) {
    return {
      nextRank: null,
      atomsRequired: BigInt(0)
    };
  }
  const nextRank = currentRank + 1;
  return {
    nextRank,
    atomsRequired: RANK_THRESHOLDS[nextRank]
  };
}
function getProgressToNextRank(currentBurned, currentRank) {
  if (currentRank === 9) {
    return {
      percentage: 100,
      atomsNeeded: BigInt(0),
      nextRank: null
    };
  }
  const nextRank = currentRank + 1;
  const nextThreshold = RANK_THRESHOLDS[nextRank];
  const currentThreshold = RANK_THRESHOLDS[currentRank];
  const progress = currentBurned - currentThreshold;
  const total = nextThreshold - currentThreshold;
  return {
    percentage: Number(progress * BigInt(100) / total),
    atomsNeeded: nextThreshold - currentBurned,
    nextRank
  };
}
function formatAtomAmount(amount) {
  const str = amount.toString();
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function getRankEmoji(rank) {
  const emojis = {
    0: "\u{1F331}",
    1: "\u2728",
    2: "\u{1F525}",
    3: "\u{1F6E1}\uFE0F",
    4: "\u{1F511}",
    5: "\u{1F52E}",
    6: "\u{1F3DB}\uFE0F",
    7: "\u{1F9D9}",
    8: "\u{1F451}",
    9: "\u267E\uFE0F"
  };
  return emojis[rank];
}
function validateRank(rank) {
  return Number.isInteger(rank) && rank >= 0 && rank <= 9;
}
function shortenAddress(address, chars = 4) {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export {
  RANK_NAMES,
  RANK_THRESHOLDS,
  DEFAULT_ATOMID_PROGRAM_ID,
  DEFAULT_RPC_URL,
  AtomIDClient,
  getRankName,
  getRankThreshold,
  calculateRankFromBurned,
  getNextRankRequirement,
  getProgressToNextRank,
  formatAtomAmount,
  getRankEmoji,
  validateRank,
  shortenAddress
};
