import {ethers} from 'ethers';
import {ConfigType} from './config';
import {humanNumberToWei} from '../test/utils';

export const liveConfig: ConfigType = {
  env: 'live',
  contractRegistry: {},
  multiSig: {
    owners: [
      {address: '0x8558fCFE23E53A9555D8aBf5544c9EFc1F108f3e', power: 2},
      {address: '0xA6e4fFa19B213AbeA258ae72e8e1a209B9E543e7', power: 1}, // deployer
      {address: '0x52aE9A8B9A962082B92AFa3B25a7D8Ba4392a151', power: 1},
      {address: '0x24582593EdF3e9C17F34e3D02DD1D6Cf51800dDf', power: 1}
      ],
    requiredPower: 3
  },
  UMB: {
    maxAllowedTotalSupply: humanNumberToWei('500,000,000'),
    name: 'Umbrella',
    symbol: 'UMB',
    initialBalance: humanNumberToWei('5,000,000'),
    initialHolder: '0x3601EC1e652a4Cc624c8C6FA74b00BdDaf5989fD' // AMM ????
  },
  stage1: {
    rUmb1: {
      initialBalance: '0',
      initialHolder: ethers.constants.AddressZero,
      rewardId: 1,
      swapDuration: 60 * 60 * 24 * 365 / 2,
      // original 40,833,334, we added more to allow increase in future:
      maxAllowedTotalSupply: humanNumberToWei('80,833,334'),
    },
    farming: {
      rewardsDistribution: '0xA6e4fFa19B213AbeA258ae72e8e1a209B9E543e7',
      tokenAmountForDeFiRewards: humanNumberToWei('40,833,333')
    },
  }
};
