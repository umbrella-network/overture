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

## Development

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

## Licensed under MIT.

This code is licensed under MIT.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
