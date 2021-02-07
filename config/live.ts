import {ethers} from 'ethers';
import {ConfigType} from './config';
import {humanNumberToWei} from '../test/utils';

export const liveConfig: ConfigType = {
  env: 'live',
  contractRegistry: {},
  multiSig: {
    owners: [
      {address: '0xA6e4fFa19B213AbeA258ae72e8e1a209B9E543e7', power: 1}
      ],
    requiredPower: 3
  },
  UMB: {
    maxAllowedTotalSupply: humanNumberToWei('500,000,000'),
    name: 'Umbrella',
    symbol: 'UMB',
    initialBalance: humanNumberToWei('5,000,000'),
    initialHolder: '0x3aD81d17D3B5FF75558271E0264085a1E6935872' // AMM
  },
  auction: {
    address: ethers.constants.AddressZero,
    amountOfTokensForAuction: humanNumberToWei('5,000,000')
  },
  stage1: {
    rUmb1: {
      initialBalance: '0',
      initialHolder: ethers.constants.AddressZero,
      rewardId: 1,
      swapDuration: 60 * 60 * 24 * 365 / 2,
      maxAllowedTotalSupply: humanNumberToWei('40,833,334'),
    },
    farming: {
      rewardsDistribution: ethers.constants.AddressZero,
      tokenAmountForDeFiRewards: humanNumberToWei('40,833,333')
    },
  }
};
