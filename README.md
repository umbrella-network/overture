# Overture


![Umbrella network - logo](./assets/umb.network-logo.png)

This repo includes token smart contract (main UMB and rewards rUMB) 
as well as distribution strategies for:
- auction
- DeFi farming
- linear vesting

DeFi farming and token distribution smart contracts that follows 
[A Proposal for the UMB Token Staking, Rewards and Distribution](
https://medium.com/umbrella-network/a-proposal-for-the-umb-token-staking-rewards-and-distribution-34e3f3499433
).


## Smart Contracts

Each smart contract has description in it. General overview is as follows:
- We deploy MultiSig wallet and we will use it as owner for any contract that is Ownable.
- Every Ownable contract has option to burn key, which we will use eventually
- For stage 0 (auction) owner will mint `UMB` that will be sold on auction
- For stage 1 (farming) we will use :
  - `StakingRewards` for standard community farming when you stake `UMB` and you farm `rUMB`
  - `Rewards` will be used for releasing tokens for nodes, contributors etc. 
    This contract can be used for distribution of any milestone rewards
- `UMB` is our main token
- `rUMB` is reward token and it can be swapped 1:1 for UMB but there are additional conditions to swap be possible.

### Live Deployment

## Development

### 1. Deploy Contracts

1. make sure configuration in `/config/live.ts` is valid
1. deploy all contracts using single/regular wallet and make yourself an owner
`npm run deploy:contracts:live`.
1. copy addresses of deployed contracts to config file
1. verify code on etherscan (deployment script provides constructor ABI)
1. verify initial contract setup like max token allowance

### 2. Setup

1. make sure configuration in `/config/live.ts` is valid
1. run `npm run setup:farming:live` to mint rUMB1 for farming contract - **it will not start farming**
1. run `npm run setup:multisig:live` to change ownership of all contract to multisig

### 3. Make it happen!

1. review contracts setups on etherscan:
- check who is the owner
- check tx (and logs) that were sent to contract
- use read contract functions to verify that all is good: amounts, durations etc.

#### Mint tokens

Owner can mint tokens (UMB and rUMB) for any wallet.

Go to UmbMultiSig on etherscan and execute `submitTokenMintTx()` - it will mint tokens for provided wallet.
Use Airdrop to distribute tokens.

#### Start Rewards Distribution + Farming

Go to UmbMultiSig on etherscan and execute `submitStakingRewardsNotifyRewardAmountTx()`, you need to confirm tx also.

- it will start farming.


*Finally take a week and go to Hawaii ;-)*

### Prerequisites

1. [brew](http://brew.sh)

  ```sh
  ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
  ```

1. [HubFlow](http://datasift.github.io/gitflow/)

  ```sh
  brew install hubflow
  ```

> If you are on Linux

  ```sh
  git clone https://github.com/datasift/gitflow
  cd gitflow
  sudo ./install.sh
  ```

### Init

* [IDE Integrations for solhint](https://github.com/protofire/solhint#ide-integrations)

```shell
npm install --save-dev hardhat
npm install -g solhint
npx hardhat
npx eslint --init
solhint --init
touch .env .env.staging

# this is for flattener to work
ln -s hardhat.config.ts buidler.config.ts
```

### Setup

```shell
git clone git@github.com:umbrella-network/overture.git
npm install
git hf init
```

Check available scripts in `package.json`

### Compiling and migrating smart contracts

There is configuration file `config/config.ts` where you can adjust settings for each environment.

#### localhost

```shell
npm test
```
