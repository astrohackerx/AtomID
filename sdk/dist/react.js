"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/react.tsx
var react_exports = {};
__export(react_exports, {
  AtomIDGate: () => AtomIDGate,
  AtomIDProvider: () => AtomIDProvider,
  RankBadge: () => RankBadge,
  RankProgressBar: () => RankProgressBar,
  useAtomID: () => useAtomID,
  useAtomIDAccount: () => useAtomIDAccount,
  useAtomIDGate: () => useAtomIDGate,
  useAtomIDRank: () => useAtomIDRank,
  useRankProgress: () => useRankProgress
});
module.exports = __toCommonJS(react_exports);
var import_react = __toESM(require("react"));

// src/client.ts
var import_web3 = require("@solana/web3.js");

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
var AtomIDClient = class {
  constructor(config = {}) {
    this.connection = new import_web3.Connection(
      config.rpcUrl || DEFAULT_RPC_URL,
      "confirmed"
    );
    this.programId = new import_web3.PublicKey(
      config.programId || DEFAULT_ATOMID_PROGRAM_ID
    );
    this.cache = /* @__PURE__ */ new Map();
    this.cacheTTL = config.cacheTTL || 3e5;
  }
  findAtomIDPDA(wallet) {
    return import_web3.PublicKey.findProgramAddressSync(
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
      const walletPubkey = typeof wallet === "string" ? new import_web3.PublicKey(wallet) : wallet;
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
      const wallet = new import_web3.PublicKey(walletBytes);
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

// src/react.tsx
var AtomIDContext = (0, import_react.createContext)(null);
function AtomIDProvider({
  children,
  config
}) {
  const [client] = (0, import_react.useState)(() => new AtomIDClient(config));
  return /* @__PURE__ */ import_react.default.createElement(AtomIDContext.Provider, { value: client }, children);
}
function useAtomID() {
  const client = (0, import_react.useContext)(AtomIDContext);
  if (!client) {
    throw new Error("useAtomID must be used within AtomIDProvider");
  }
  return client;
}
function useAtomIDAccount(wallet) {
  const client = useAtomID();
  const [account, setAccount] = (0, import_react.useState)(null);
  const [loading, setLoading] = (0, import_react.useState)(true);
  const [error, setError] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
    if (!wallet) {
      setAccount(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      if (!wallet) return;
      try {
        setLoading(true);
        setError(null);
        const result = await client.verify(wallet);
        if (!cancelled) {
          if (result.exists && result.account) {
            setAccount(result.account);
          } else {
            setAccount(null);
            if (result.error) {
              setError(result.error);
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setAccount(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [client, wallet?.toString()]);
  return { account, loading, error };
}
function useAtomIDRank(wallet) {
  const { account, loading, error } = useAtomIDAccount(wallet);
  return {
    rank: account?.rank ?? 0,
    rankName: account ? getRankName(account.rank) : "Initiate",
    rankEmoji: account ? getRankEmoji(account.rank) : "\u{1F331}",
    totalBurned: account?.totalBurned ?? BigInt(0),
    loading,
    error
  };
}
function useAtomIDGate(wallet, minRank) {
  const { rank, loading } = useAtomIDRank(wallet);
  return {
    hasAccess: rank >= minRank,
    currentRank: rank,
    requiredRank: minRank,
    loading
  };
}
function useRankProgress(wallet) {
  const { account, loading } = useAtomIDAccount(wallet);
  if (!account || loading) {
    return {
      percentage: 0,
      atomsNeeded: BigInt(0),
      nextRank: null,
      loading
    };
  }
  const progress = getProgressToNextRank(account.totalBurned, account.rank);
  return {
    ...progress,
    loading: false
  };
}
function AtomIDGate({
  wallet,
  minRank,
  children,
  fallback
}) {
  const { hasAccess, loading, currentRank } = useAtomIDGate(wallet, minRank);
  if (loading) {
    return /* @__PURE__ */ import_react.default.createElement("div", null, "Loading AtomID...");
  }
  if (!hasAccess) {
    return /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, fallback || /* @__PURE__ */ import_react.default.createElement("div", null, "Access denied. Required rank: ", minRank, ", Your rank: ", currentRank));
  }
  return /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, children);
}
function RankBadge({
  wallet,
  showName = true,
  showEmoji = true
}) {
  const { rank, rankName, rankEmoji, loading } = useAtomIDRank(wallet);
  if (loading) {
    return /* @__PURE__ */ import_react.default.createElement("span", null, "...");
  }
  return /* @__PURE__ */ import_react.default.createElement("span", { className: "atomid-badge" }, showEmoji && /* @__PURE__ */ import_react.default.createElement("span", { className: "atomid-emoji" }, rankEmoji), showName && /* @__PURE__ */ import_react.default.createElement("span", { className: "atomid-name" }, rankName), /* @__PURE__ */ import_react.default.createElement("span", { className: "atomid-rank" }, rank));
}
function RankProgressBar({
  wallet
}) {
  const { percentage, atomsNeeded, nextRank, loading } = useRankProgress(wallet);
  if (loading) {
    return /* @__PURE__ */ import_react.default.createElement("div", null, "Loading...");
  }
  if (nextRank === null) {
    return /* @__PURE__ */ import_react.default.createElement("div", null, "Max rank achieved! \u267E\uFE0F");
  }
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "atomid-progress" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "atomid-progress-bar", style: { width: `${percentage}%` } }), /* @__PURE__ */ import_react.default.createElement("div", { className: "atomid-progress-text" }, percentage, "% to ", getRankName(nextRank), " (", atomsNeeded.toString(), " ATOM needed)"));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AtomIDGate,
  AtomIDProvider,
  RankBadge,
  RankProgressBar,
  useAtomID,
  useAtomIDAccount,
  useAtomIDGate,
  useAtomIDRank,
  useRankProgress
});
