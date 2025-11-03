import React, { ReactNode } from 'react';
import { PublicKey } from '@solana/web3.js';
import { c as AtomIDConfig, a as AtomIDClient, b as AtomIDAccount, A as AtomIDRank } from './client-CP0vUS-d.js';

declare function AtomIDProvider({ children, config }: {
    children: ReactNode;
    config?: AtomIDConfig;
}): React.JSX.Element;
declare function useAtomID(): AtomIDClient;
declare function useAtomIDAccount(wallet?: PublicKey | string): {
    account: AtomIDAccount | null;
    loading: boolean;
    error: string | null;
};
declare function useAtomIDRank(wallet?: PublicKey | string): {
    rank: AtomIDRank;
    rankName: string;
    rankEmoji: string;
    totalBurned: bigint;
    loading: boolean;
    error: string | null;
};
declare function useAtomIDGate(wallet: PublicKey | string | undefined, minRank: AtomIDRank): {
    hasAccess: boolean;
    currentRank: AtomIDRank;
    requiredRank: AtomIDRank;
    loading: boolean;
};
declare function useRankProgress(wallet?: PublicKey | string): {
    loading: boolean;
    percentage: number;
    atomsNeeded: bigint;
    nextRank: AtomIDRank | null;
};
declare function AtomIDGate({ wallet, minRank, children, fallback }: {
    wallet?: PublicKey | string;
    minRank: AtomIDRank;
    children: ReactNode;
    fallback?: ReactNode;
}): React.JSX.Element;
declare function RankBadge({ wallet, showName, showEmoji }: {
    wallet?: PublicKey | string;
    showName?: boolean;
    showEmoji?: boolean;
}): React.JSX.Element;
declare function RankProgressBar({ wallet }: {
    wallet?: PublicKey | string;
}): React.JSX.Element;

export { AtomIDGate, AtomIDProvider, RankBadge, RankProgressBar, useAtomID, useAtomIDAccount, useAtomIDGate, useAtomIDRank, useRankProgress };
