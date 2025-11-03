/**
 * React App Example with AtomID SDK
 */

import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  AtomIDProvider,
  useAtomIDRank,
  useAtomIDGate,
  AtomIDGate,
  RankBadge,
  RankProgressBar
} from "atomid-sdk/react";

// Wrap your app with AtomIDProvider
export function App() {
  return (
    <AtomIDProvider>
      <YourApp />
    </AtomIDProvider>
  );
}

// Display user's rank
function UserProfile() {
  const { publicKey } = useWallet();
  const { rank, rankName, rankEmoji, totalBurned, loading } = useAtomIDRank(publicKey);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="profile">
      <h2>Your AtomID</h2>
      <div className="rank">
        <span className="emoji">{rankEmoji}</span>
        <span className="name">{rankName}</span>
        <span className="number">Rank {rank}</span>
      </div>
      <p>Total Burned: {totalBurned.toString()} ATOM</p>
    </div>
  );
}

// Gate content by rank
function PremiumFeature() {
  const { publicKey } = useWallet();

  return (
    <AtomIDGate
      wallet={publicKey}
      minRank={5}
      fallback={
        <div className="locked">
          <h3>🔒 Oracle Rank Required</h3>
          <p>Burn more ATOM to unlock this feature</p>
        </div>
      }
    >
      <div className="premium">
        <h3>✨ Premium Content</h3>
        <p>Exclusive content for Oracle rank and above!</p>
      </div>
    </AtomIDGate>
  );
}

// Show rank badge
function UserBadge() {
  const { publicKey } = useWallet();

  return (
    <div className="badge">
      <RankBadge wallet={publicKey} showName showEmoji />
    </div>
  );
}

// Show progress to next rank
function ProgressTracker() {
  const { publicKey } = useWallet();

  return (
    <div className="progress">
      <h3>Your Progress</h3>
      <RankProgressBar wallet={publicKey} />
    </div>
  );
}

// Conditional pricing based on rank
function PricingDisplay() {
  const { publicKey } = useWallet();
  const { rank } = useAtomIDRank(publicKey);

  const basePrice = 100;
  const discount = rank * 0.1;
  const finalPrice = basePrice * (1 - discount);

  return (
    <div className="pricing">
      <h3>Your Price</h3>
      <p className="base">Base: ${basePrice}</p>
      <p className="discount">Discount: {(discount * 100).toFixed(0)}%</p>
      <p className="final">Final: ${finalPrice.toFixed(2)}</p>
    </div>
  );
}

// Access control hook
function FeatureWithGate() {
  const { publicKey } = useWallet();
  const { hasAccess, currentRank, requiredRank, loading } = useAtomIDGate(publicKey, 5);

  if (loading) return <div>Checking access...</div>;

  if (!hasAccess) {
    return (
      <div>
        ❌ Access denied. You are rank {currentRank}, need rank {requiredRank}
      </div>
    );
  }

  return <div>✅ Welcome! You have access.</div>;
}

// Complete example app
function YourApp() {
  const { publicKey, connected } = useWallet();

  if (!connected) {
    return <div>Please connect your wallet</div>;
  }

  return (
    <div className="app">
      <header>
        <h1>My AtomID App</h1>
        <UserBadge />
      </header>

      <main>
        <section>
          <UserProfile />
        </section>

        <section>
          <ProgressTracker />
        </section>

        <section>
          <PricingDisplay />
        </section>

        <section>
          <PremiumFeature />
        </section>

        <section>
          <FeatureWithGate />
        </section>
      </main>
    </div>
  );
}
