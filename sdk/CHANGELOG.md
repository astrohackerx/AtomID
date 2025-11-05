# Changelog

## [2.0.0] - 2025-11-05

### Fixed
- **CRITICAL**: Fixed incorrect data parsing from on-chain accounts
  - `total_burned` was being read from wrong byte offset (41 instead of 40)
  - Was displaying 576 trillion ATOM instead of actual 844,444 ATOM ❌→✅
  - Removed non-existent fields (`atomsMinted`, `createdAt`, `lastBurnedAt`)
  - Replaced with correct fields (`createdAtSlot`, `updatedAtSlot`)
  - Fixed variable-length metadata parsing to correctly locate subsequent fields

- **CRITICAL**: Fixed decimal conversion for ATOM token amounts
  - SDK now correctly handles ATOM's 6 decimals
  - Raw on-chain values are now properly converted to human-readable format
  - Example: Raw value `844444000000` now displays as `844,444 ATOM` instead of `844444000000 ATOM`

### Added
- `ATOM_DECIMALS` constant (value: 6)
- `DECIMALS_MULTIPLIER` constant for conversion calculations
- `rawToHumanReadable()` function to convert raw amounts to human-readable numbers
- `humanReadableToRaw()` function to convert human-readable amounts to raw format
- Test script (`test-sdk.js`) to verify SDK functionality before publishing
- Updated `formatAtomAmount()` to automatically handle decimal conversion

### Changed
- `RANK_THRESHOLDS` now use raw on-chain values (with decimals included)
- All examples updated to use `formatAtomAmount()` for proper display
- Documentation updated with correct decimal handling examples

### Added
- **RPC Endpoint Documentation**: Added critical warnings about RPC configuration
  - Default public RPC (`api.mainnet-beta.solana.com`) is unreliable and rate-limited
  - Documentation now includes setup instructions for custom RPC endpoints (Helius, QuickNode, Alchemy)
  - All examples updated to show RPC configuration
- **Leaderboard Improvements**: Fixed discriminator filtering to properly fetch AtomID accounts
  - Now filters by AtomID account discriminator (`609742dc4dd3839a`)
  - Handles variable-size accounts correctly (due to metadata field)

### Breaking Changes

The `AtomIDAccount` interface has changed:

**Removed fields** (these never existed in the on-chain program):
- `atomsMinted: bigint` ❌
- `createdAt: Date` ❌
- `lastBurnedAt: Date` ❌

**Added fields** (matching the actual Rust struct):
- `createdAtSlot: number` ✅
- `updatedAtSlot: number` ✅

### Migration Guide

If you're upgrading from 1.0.1:

**Update field references**:
```typescript
const result = await client.verify(wallet);
if (result.account) {
  // ❌ OLD (wrong fields):
  // const { atomsMinted, createdAt, lastBurnedAt } = result.account;

  // ✅ NEW (correct fields):
  const { createdAtSlot, updatedAtSlot } = result.account;
}
```

**Use formatAtomAmount for display**:
```typescript
import { formatAtomAmount } from "atomid-sdk";

const result = await client.verify(wallet);
console.log(`Burned: ${formatAtomAmount(result.account.totalBurned)} ATOM`); // Shows: 844,444 ATOM ✅
```

## [1.0.1] - Previous Release

Initial release with SAS integration.

## [1.0.0] - Initial Release

First stable release of AtomID SDK.
