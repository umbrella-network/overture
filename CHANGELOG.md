# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2021-08-08
### Changed
**`UmbMultiSig` (old gnosis wallet) will be deprecated.**

Switching to new version of Gnosis Safe multisig.

- Goerli: [Wallet](https://goerli.etherscan.io/address/0xD97F4A4a40F5990Ae8AD77345faE3c0CA54C9339), 
  [UI app](https://gnosis-safe.io/app/gor:0xD97F4A4a40F5990Ae8AD77345faE3c0CA54C9339/home).
- Ethereum: [Wallet](https://etherscan.io/address/0x1C6262c252731d17e5b3Cb5c569216d59d37d70D),
  [UI app](https://gnosis-safe.io/app/eth:0x1C6262c252731d17e5b3Cb5c569216d59d37d70D/home).
- BSC: [Wallet](https://bscscan.com/address/0x7724411cbD7ab3F9Ce7af882Ce44D2b27890359c),
  [UI app](https://gnosis-safe.io/app/bnb:0x7724411cbD7ab3F9Ce7af882Ce44D2b27890359c/home).

## [1.0.1] - 2021-07-21
### Changed
- revert `UmbMultiSig` to audited version from commit [23778f16](https://github.com/umbrella-network/overture/tree/23778f165bc00a0906ae0aa81d119849982d4c56)

## [1.0.0] - 2021-02-09
### Added
- initial version
- configuration for deployment
- scripts to deploy stage 0: Auction
- additional helpers for `Auction` and `Rewards` in MultiSig
- scripts to deploy stage 1: DeFi farming
- stop method for farming
- initial config for launch
- flag for demo contract, that allows us to stop auction

### Changed
- merge `BurnableToken` and `MaxAllowedSupply` into `MintableToken`

### Fixed
- `PowerMultiSig` wallet has trouble with returning right result for `.external_call()`.
  It is fixed, but we should take a second look on this. It's marked with `@todo`
- Fix invalid requirements about participants count in `Rewards.startDistribution()`
- quick fix for missing `ERC20.burn()` during `StakingRewards` compilation
- calculation for token price and unsold umb
