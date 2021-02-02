import hre from 'hardhat';
import {ethers} from 'ethers';
import {oneMonth, oneYear} from '../scripts/helpers';
import {ConfigType} from './config';

const {toWei} = hre.web3.utils;

export const liveConfig: ConfigType = {
  env: 'live',
  contractRegistry: {},
  multiSig: {
    owners: [],
    requiredPower: 0
  },
  UMB: {
    maxAllowedTotalSupply: hre.web3.utils.toWei('500000000', 'ether'),
    name: 'Umbrella',
    symbol: 'UMB',
    initialBalance: toWei('15000000', 'ether'), // for liquidity
    initialHolder: ethers.constants.AddressZero
  },
  auction: {
    address: ethers.constants.AddressZero,
    amountOfTokensForAuction: toWei('50000000', 'ether') //they will go directly to auction contract
  },
  stage1: {
    rUmb1: {
      initialBalance: '0',
      initialHolder: ethers.constants.AddressZero,
      rewardId: 1,
      swapDuration: 60 * 60 * 24 * 365 / 2,
      maxAllowedTotalSupply: toWei('500000000', 'ether'),
    },
    farming: {
      rewardsDistribution: ethers.constants.AddressZero,
      tokenAmountForDeFiRewards: toWei('45833333', 'ether')
    },
    Rewards: {
      data: [
        {
          participant: 'node found address',
          amount: toWei('50000000', 'ether'),
          duration: oneYear * 4
        },
        {
          participant: 'partner found address',
          amount: toWei('50000000', 'ether'),
          duration: oneYear * 4
        },
        {
          participant: 'development found address',
          amount: toWei('50000000', 'ether'),
          duration: oneYear * 4
        },
        {
          participant: 'contributors address',
          amount: toWei('50000000', 'ether'),
          duration: oneMonth * 18
        },
        {
          participant: 'Founding Team address',
          amount: toWei('51666667', 'ether'),
          duration: oneYear * 4
        },
      ],
      startTime: Date.UTC(2021, 1, 21)
    }
  }
};
