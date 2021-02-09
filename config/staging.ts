import hre from 'hardhat';
import {ethers} from 'ethers';
import {ConfigType} from './config';

const {toWei} = hre.web3.utils;

export const stagingConfig: ConfigType = {
  env: 'staging',
  contractRegistry: {},
  multiSig: {
    // address: '0xa5d96dF87bC54B1B7B395D414d1AA177eF9C7dad',
    owners: [
      {address: '0x66f13FDceed822E74b6a1e08e082Fa699fF36454', power: 5},
    ],
    requiredPower: 5
  },
  UMB: {
    // address: '0x6F6f5629214f6E3186699FCC4e2B383a7eC0495F',
    maxAllowedTotalSupply: hre.web3.utils.toWei('500000000', 'ether'),
    name: 'Umbrella',
    symbol: 'UMB',
    initialBalance: '0',
    initialHolder: ethers.constants.AddressZero
  },
  stage1: {
    rUmb1: {
      // address: '0x19fd817361c403a0B35606f6f0b30a80082FCDB9',
      initialBalance: '0',
      initialHolder: ethers.constants.AddressZero,
      rewardId: 1,
      swapDuration: 60 * 60 * 24 * 365 / 2,
      maxAllowedTotalSupply: toWei('500000000', 'ether'),
    },
    farming: {
      // address: '0xF28287DCe42152836374a09dbD47a2b50403349C',
      // who can notify about reward and start whole farming process:
      rewardsDistribution: '0x66f13FDceed822E74b6a1e08e082Fa699fF36454',
      tokenAmountForDeFiRewards: toWei('45833333', 'ether')
    },
  }
};
