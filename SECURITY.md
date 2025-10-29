# Security Policy

## Overview

AtomID is a verifiable on-chain identity system built on Solana. This document outlines our security practices and how to report security vulnerabilities.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### Reporting Process

1. **DO NOT** open a public GitHub issue
2. Email: security@yourdomain.com (replace with your actual security email)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Initial Response**: Within 24-48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 1-7 days
  - High: 7-14 days
  - Medium: 14-30 days
  - Low: 30+ days

## Security Measures

### Smart Contract Security

1. **Verifiable Builds**
   - All mainnet deployments use `anchor build --verifiable`
   - Source code publicly available on GitHub
   - Program verified on Solscan

2. **Access Controls**
   - Admin functions protected by signer checks
   - PDA derivations use secure seeds
   - All accounts validated

3. **Data Integrity**
   - SAS attestations for verifiable data
   - On-chain validation of burn amounts
   - Immutable historical records

4. **Economic Security**
   - Minimum burn requirements
   - Rank thresholds prevent gaming
   - One attestation per user

### Operational Security

1. **Key Management**
   - Admin keys stored in hardware wallets
   - Multisig recommended for mainnet
   - Regular key rotation

2. **Monitoring**
   - Transaction monitoring on Solscan
   - Alert systems for unusual activity
   - Regular security audits

3. **Upgrades**
   - Upgrade authority controlled by multisig
   - Testing on devnet before mainnet
   - Gradual rollouts

## Known Limitations

1. **Program Upgrades**: Admin has upgrade authority (consider revoking after stability)
2. **Config Updates**: Admin can update rank thresholds and minimum burns
3. **Token Burns**: Permanent and irreversible by design

## Audit Status

- **Current Status**: Not audited
- **Planned**: Security audit before handling significant value
- **Bug Bounty**: Under consideration

## Best Practices for Integrators

If you're integrating AtomID into your dApp:

1. **Verify Attestations**: Always check attestation source is SAS program
2. **Validate PDAs**: Derive PDAs yourself, don't trust user input
3. **Cache Wisely**: Cache attestation data but refresh periodically
4. **Handle Errors**: Account for missing or invalid attestations
5. **Test Thoroughly**: Test on devnet before mainnet integration

## Responsible Disclosure

We follow coordinated vulnerability disclosure:

1. Report received and acknowledged
2. Vulnerability validated and severity assessed
3. Fix developed and tested
4. Fix deployed to mainnet
5. Public disclosure (90 days after fix or by agreement)

## Acknowledgements

We appreciate security researchers who help keep AtomID secure. Acknowledged contributors:

- (None yet - be the first!)

## Security Contacts

- **Email**: astrohackerx@protonmail.com
- **Twitter**: https://x.com/lostbtclayer

## Additional Resources

- [Solana Security Best Practices](https://docs.solana.com/developing/programming-model/security)
- [Anchor Security Guidelines](https://www.anchor-lang.com/docs/security)
- [SAS Documentation](https://github.com/your-sas-docs)

## Updates

This security policy is subject to updates. Check back regularly or watch the repository for changes.

**Last Updated**: 2025-10-29

---

Thank you for helping keep AtomID and its users safe!
