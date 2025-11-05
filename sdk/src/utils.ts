import { AtomIDRank, RANK_NAMES, RANK_THRESHOLDS, ATOM_DECIMALS, DECIMALS_MULTIPLIER } from "./types";

export function getRankName(rank: AtomIDRank): string {
  return RANK_NAMES[rank];
}

export function getRankThreshold(rank: AtomIDRank): bigint {
  return RANK_THRESHOLDS[rank];
}

export function calculateRankFromBurned(burned: bigint): AtomIDRank {
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

export function getNextRankRequirement(currentRank: AtomIDRank): {
  nextRank: AtomIDRank | null;
  atomsRequired: bigint;
} {
  if (currentRank === 9) {
    return {
      nextRank: null,
      atomsRequired: BigInt(0)
    };
  }

  const nextRank = (currentRank + 1) as AtomIDRank;
  return {
    nextRank,
    atomsRequired: RANK_THRESHOLDS[nextRank]
  };
}

export function getProgressToNextRank(
  currentBurned: bigint,
  currentRank: AtomIDRank
): {
  percentage: number;
  atomsNeeded: bigint;
  nextRank: AtomIDRank | null;
} {
  if (currentRank === 9) {
    return {
      percentage: 100,
      atomsNeeded: BigInt(0),
      nextRank: null
    };
  }

  const nextRank = (currentRank + 1) as AtomIDRank;
  const nextThreshold = RANK_THRESHOLDS[nextRank];
  const currentThreshold = RANK_THRESHOLDS[currentRank];
  const progress = currentBurned - currentThreshold;
  const total = nextThreshold - currentThreshold;

  return {
    percentage: Number((progress * BigInt(100)) / total),
    atomsNeeded: nextThreshold - currentBurned,
    nextRank
  };
}

export function rawToHumanReadable(rawAmount: bigint): number {
  return Number(rawAmount) / Number(DECIMALS_MULTIPLIER);
}

export function humanReadableToRaw(humanAmount: number): bigint {
  return BigInt(Math.floor(humanAmount * Number(DECIMALS_MULTIPLIER)));
}

export function formatAtomAmount(amount: bigint, includeDecimals: boolean = true): string {
  if (includeDecimals) {
    const humanAmount = rawToHumanReadable(amount);
    return humanAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }
  const str = amount.toString();
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function getRankEmoji(rank: AtomIDRank): string {
  const emojis: Record<AtomIDRank, string> = {
    0: "🌱",
    1: "✨",
    2: "🔥",
    3: "🛡️",
    4: "🔑",
    5: "🔮",
    6: "🏛️",
    7: "🧙",
    8: "👑",
    9: "♾️"
  };
  return emojis[rank];
}

export function validateRank(rank: number): rank is AtomIDRank {
  return Number.isInteger(rank) && rank >= 0 && rank <= 9;
}

export function shortenAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
