# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased
### Added
- initial version
- configuration for deployment
- scripts to deploy stage 0: Auction

### Fixed
- `PowerMultiSig` wallet has trouble with returning right result for `.external_call()`.
  It is fixed, but we should take a second look on this. It's marked with `@todo`
