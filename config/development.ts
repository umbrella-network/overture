import hre from 'hardhat';
import {ethers} from 'ethers';
import {currentTimestamp, oneMonth} from '../scripts/helpers';
import {ConfigType} from './config';

const {toWei} = hre.web3.utils;

export const developmentConfig: ConfigType = {
  env: 'development',
  contractRegistry: {},
  multiSig: {
    address: '0x2D8553F9ddA85A9B3259F6Bf26911364B85556F5',
    owners: [
      {address: '0xc783df8a850f42e7F7e57013759C285caa701eB6', power: 5}, // one of defined addresses in local node
      {address: '0xead9c93b79ae7c1591b1fb5323bd777e86e150d4', power: 5}
    ],
    requiredPower: 5
  },
  UMB: {
    address: '0x52d3b94181f8654db2530b0fEe1B19173f519C52',
    maxAllowedTotalSupply: toWei('500000000', 'ether'),
    name: 'Umbrella',
    symbol: 'UMB',
    initialBalance: '0', // toWei('150000000', 'ether'), for liquidity
    initialHolder: ethers.constants.AddressZero
  },
  auction: {
    address: '0xc783df8a850f42e7F7e57013759C285caa701eB6',
    amountOfTokensForAuction: toWei('50000000', 'ether')
  },
  stage1: {
    rUmb1: {
      address: '0xd15468525c35BDBC1eD8F2e09A00F8a173437f2f',
      initialBalance: '0',
      initialHolder: ethers.constants.AddressZero,
      rewardId: 1,
      swapDuration: oneMonth * 6,
      maxAllowedTotalSupply: toWei('500000000', 'ether'),
    },
    farming: {
      address: '0x53369fd4680FfE3DfF39Fc6DDa9CfbfD43daeA2E',
      rewardsDistribution: '0xc783df8a850f42e7F7e57013759C285caa701eB6',
      tokenAmountForDeFiRewards: toWei('123000', 'ether')
    },
    Rewards: {
      address: '0x7e35Eaf7e8FBd7887ad538D4A38Df5BbD073814a',
      data: [
        {
          participant: '0x66f13FDceed822E74b6a1e08e082Fa699fF36454',
          amount: toWei('12', 'ether'),
          duration: oneMonth
        }
      ],
      startTime: currentTimestamp
    }
  }
};
