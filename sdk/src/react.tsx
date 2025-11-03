import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { PublicKey } from "@solana/web3.js";
import { AtomIDClient } from "./client";
import { AtomIDAccount, AtomIDConfig, AtomIDRank } from "./types";
import { getRankName, getRankEmoji, getProgressToNextRank } from "./utils";

const AtomIDContext = createContext<AtomIDClient | null>(null);

export function AtomIDProvider({
  children,
  config
}: {
  children: ReactNode;
  config?: AtomIDConfig;
}) {
  const [client] = useState(() => new AtomIDClient(config));

  return (
    <AtomIDContext.Provider value={client}>
      {children}
    </AtomIDContext.Provider>
  );
}

export function useAtomID() {
  const client = useContext(AtomIDContext);
  if (!client) {
    throw new Error("useAtomID must be used within AtomIDProvider");
  }
  return client;
}

export function useAtomIDAccount(wallet?: PublicKey | string) {
  const client = useAtomID();
  const [account, setAccount] = useState<AtomIDAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet) {
      setAccount(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
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

export function useAtomIDRank(wallet?: PublicKey | string) {
  const { account, loading, error } = useAtomIDAccount(wallet);

  return {
    rank: account?.rank ?? 0,
    rankName: account ? getRankName(account.rank) : "Initiate",
    rankEmoji: account ? getRankEmoji(account.rank) : "🌱",
    totalBurned: account?.totalBurned ?? BigInt(0),
    loading,
    error
  };
}

export function useAtomIDGate(
  wallet: PublicKey | string | undefined,
  minRank: AtomIDRank
) {
  const { rank, loading } = useAtomIDRank(wallet);

  return {
    hasAccess: rank >= minRank,
    currentRank: rank,
    requiredRank: minRank,
    loading
  };
}

export function useRankProgress(wallet?: PublicKey | string) {
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

export function AtomIDGate({
  wallet,
  minRank,
  children,
  fallback
}: {
  wallet?: PublicKey | string;
  minRank: AtomIDRank;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasAccess, loading, currentRank } = useAtomIDGate(wallet, minRank);

  if (loading) {
    return <div>Loading AtomID...</div>;
  }

  if (!hasAccess) {
    return (
      <>
        {fallback || (
          <div>
            Access denied. Required rank: {minRank}, Your rank: {currentRank}
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}

export function RankBadge({
  wallet,
  showName = true,
  showEmoji = true
}: {
  wallet?: PublicKey | string;
  showName?: boolean;
  showEmoji?: boolean;
}) {
  const { rank, rankName, rankEmoji, loading } = useAtomIDRank(wallet);

  if (loading) {
    return <span>...</span>;
  }

  return (
    <span className="atomid-badge">
      {showEmoji && <span className="atomid-emoji">{rankEmoji}</span>}
      {showName && <span className="atomid-name">{rankName}</span>}
      <span className="atomid-rank">{rank}</span>
    </span>
  );
}

export function RankProgressBar({
  wallet
}: {
  wallet?: PublicKey | string;
}) {
  const { percentage, atomsNeeded, nextRank, loading } = useRankProgress(wallet);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (nextRank === null) {
    return <div>Max rank achieved! ♾️</div>;
  }

  return (
    <div className="atomid-progress">
      <div className="atomid-progress-bar" style={{ width: `${percentage}%` }} />
      <div className="atomid-progress-text">
        {percentage}% to {getRankName(nextRank)} ({atomsNeeded.toString()} ATOM needed)
      </div>
    </div>
  );
}
