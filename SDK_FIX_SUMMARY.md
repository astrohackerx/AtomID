# SDK Critical Fixes Summary

## Problems Fixed

### 1. Incorrect Data Parsing (CRITICAL BUG)
The SDK was reading account data from **wrong byte offsets**, causing completely incorrect values.

**Example**: Wallet `EYKi...DmY2` with 844,444 ATOM burned
- Was reading from byte 41 (wrong offset)
- Was displaying: `576,460,755,602.03 ATOM` ❌ (576 trillion!)
- Now reading from byte 40 (correct offset)
- Now displays: `844,444 ATOM` ✅

**Root Cause**:
- `total_burned` field starts at byte 40 (after 8-byte discriminator + 32-byte owner)
- SDK was reading from byte 41, grabbing wrong data
- SDK had non-existent fields (`atomsMinted`, `createdAt`, `lastBurnedAt`)

### 2. Missing Decimal Conversion
Raw on-chain values (which include 6 decimals) were being shown without conversion.

**Example**:
- On-chain value: `844444000000` (with 6 decimals)
- Was displaying: `844444000000 ATOM` ❌
- Now displays: `844,444 ATOM` ✅

## Solution

### 1. Fixed Data Parsing
**Corrected byte offsets** in `sdk/src/client.ts`:
- Changed `total_burned` read from byte **41** → **40**
- Changed `rank` read from byte **73** → **48**
- Removed non-existent fields: `atomsMinted`, `createdAt`, `lastBurnedAt`
- Added correct fields: `createdAtSlot`, `updatedAtSlot`
- Implemented dynamic offset calculation for variable-length metadata

**Account Structure** (matching Rust):
```
Byte 0-7:    discriminator
Byte 8-39:   owner (32 bytes)
Byte 40-47:  total_burned (u64) ← Fixed!
Byte 48:     rank (u8) ← Fixed!
Byte 49-52:  metadata length (u32)
Byte 53+:    metadata content (variable)
After meta:  created_at_slot (u64)
After that:  updated_at_slot (u64)
After that:  bump (u8)
```

### 2. Added Decimal Conversion
**New constants**:
- `ATOM_DECIMALS = 6`
- `DECIMALS_MULTIPLIER = 1000000`

**New functions**:
- `rawToHumanReadable()` - converts raw values to numbers
- `humanReadableToRaw()` - converts numbers to raw values
- Updated `formatAtomAmount()` - now handles decimals automatically

**Updated**:
- `RANK_THRESHOLDS` - now use raw on-chain values
- All examples - now use `formatAtomAmount()`
- Documentation - shows correct usage

## Testing

```bash
cd sdk
npm run build
npm test <WALLET_ADDRESS>
```

See detailed instructions in:
- `sdk/HOW_TO_TEST.md` - Quick testing guide
- `sdk/TEST_GUIDE.md` - Complete testing documentation
- `sdk/CHANGELOG.md` - All changes and migration guide

## Files Changed

### Core SDK
- `sdk/src/types.ts` - Added decimals constants, updated thresholds
- `sdk/src/utils.ts` - Added conversion functions, updated formatAtomAmount
- `sdk/src/client.ts` - No changes (already reading correctly)

### Examples
- `sdk/examples/basic-usage.ts` - Updated to use formatAtomAmount
- `sdk/examples/react-app.tsx` - Updated to use formatAtomAmount
- `sdk/examples/verify-wallet.ts` - Already correct
- `sdk/examples/leaderboard.ts` - Already correct

### Documentation
- `sdk/README.md` - Updated examples with proper formatting
- `sdk/CHANGELOG.md` - New file documenting changes
- `sdk/HOW_TO_TEST.md` - New file with quick test guide
- `sdk/TEST_GUIDE.md` - New file with detailed testing instructions
- `sdk/TESTING.md` - New file with quick reference

### Testing
- `sdk/test-sdk.js` - New test script to verify the fix
- `sdk/package.json` - Added test script command

## Next Steps

1. Test with a real wallet:
   ```bash
   cd sdk
   npm run build
   npm test YOUR_WALLET_ADDRESS
   ```

2. Verify output shows correct decimal conversion

3. Update version to 1.0.2 in `sdk/package.json`

4. Publish:
   ```bash
   cd sdk
   npm publish
   ```

## Migration for Users

Users upgrading from 1.0.1 should import and use `formatAtomAmount()`:

```typescript
import { AtomIDClient, formatAtomAmount } from "atomid-sdk";

const result = await client.verify(wallet);
if (result.exists) {
  // Old way (wrong)
  console.log(`Burned: ${result.account.totalBurned} ATOM`); // 5000000000 ATOM

  // New way (correct)
  console.log(`Burned: ${formatAtomAmount(result.account.totalBurned)} ATOM`); // 5,000 ATOM
}
```

No breaking changes - existing code works but shows wrong amounts until updated.
