import {
  AtomIDClient,
  getProgressToNextRank,
  getRankEmoji,
  getRankName
} from "./chunk-GQBHWRWX.mjs";

// src/react.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
var AtomIDContext = createContext(null);
function AtomIDProvider({
  children,
  config
}) {
  const [client] = useState(() => new AtomIDClient(config));
  return /* @__PURE__ */ React.createElement(AtomIDContext.Provider, { value: client }, children);
}
function useAtomID() {
  const client = useContext(AtomIDContext);
  if (!client) {
    throw new Error("useAtomID must be used within AtomIDProvider");
  }
  return client;
}
function useAtomIDAccount(wallet) {
  const client = useAtomID();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
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
    return /* @__PURE__ */ React.createElement("div", null, "Loading AtomID...");
  }
  if (!hasAccess) {
    return /* @__PURE__ */ React.createElement(React.Fragment, null, fallback || /* @__PURE__ */ React.createElement("div", null, "Access denied. Required rank: ", minRank, ", Your rank: ", currentRank));
  }
  return /* @__PURE__ */ React.createElement(React.Fragment, null, children);
}
function RankBadge({
  wallet,
  showName = true,
  showEmoji = true
}) {
  const { rank, rankName, rankEmoji, loading } = useAtomIDRank(wallet);
  if (loading) {
    return /* @__PURE__ */ React.createElement("span", null, "...");
  }
  return /* @__PURE__ */ React.createElement("span", { className: "atomid-badge" }, showEmoji && /* @__PURE__ */ React.createElement("span", { className: "atomid-emoji" }, rankEmoji), showName && /* @__PURE__ */ React.createElement("span", { className: "atomid-name" }, rankName), /* @__PURE__ */ React.createElement("span", { className: "atomid-rank" }, rank));
}
function RankProgressBar({
  wallet
}) {
  const { percentage, atomsNeeded, nextRank, loading } = useRankProgress(wallet);
  if (loading) {
    return /* @__PURE__ */ React.createElement("div", null, "Loading...");
  }
  if (nextRank === null) {
    return /* @__PURE__ */ React.createElement("div", null, "Max rank achieved! \u267E\uFE0F");
  }
  return /* @__PURE__ */ React.createElement("div", { className: "atomid-progress" }, /* @__PURE__ */ React.createElement("div", { className: "atomid-progress-bar", style: { width: `${percentage}%` } }), /* @__PURE__ */ React.createElement("div", { className: "atomid-progress-text" }, percentage, "% to ", getRankName(nextRank), " (", atomsNeeded.toString(), " ATOM needed)"));
}
export {
  AtomIDGate,
  AtomIDProvider,
  RankBadge,
  RankProgressBar,
  useAtomID,
  useAtomIDAccount,
  useAtomIDGate,
  useAtomIDRank,
  useRankProgress
};
