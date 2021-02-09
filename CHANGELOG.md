# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

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
