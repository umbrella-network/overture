import hre from 'hardhat';
import {ethers} from 'ethers';
import {oneMonth} from '../scripts/helpers';
import {ConfigType} from './config';

const {toWei} = hre.web3.utils;

export const developmentConfig: ConfigType = {
  env: 'development',
  contractRegistry: {},
  multiSig: {
    address: '0x7c2C195CD6D34B8F845992d380aADB2730bB9C6F',
    owners: [
      {address: '0xc783df8a850f42e7F7e57013759C285caa701eB6', power: 5}, // one of defined addresses in local node
      {address: '0xead9c93b79ae7c1591b1fb5323bd777e86e150d4', power: 5}
    ],
    requiredPower: 5
  },
  UMB: {
    address: '0x8858eeB3DfffA017D4BCE9801D340D36Cf895CCf',
    maxAllowedTotalSupply: toWei('500000000', 'ether'),
    name: 'Umbrella',
    symbol: 'UMB',
    initialBalance: '0', // toWei('150000000', 'ether'), for liquidity
    initialHolder: ethers.constants.AddressZero
  },
  stage1: {
    rUmb1: {
      address: '0x0078371BDeDE8aAc7DeBfFf451B74c5EDB385Af7',
      initialBalance: '0',
      initialHolder: ethers.constants.AddressZero,
      rewardId: 1,
      swapDuration: oneMonth * 6,
      maxAllowedTotalSupply: toWei('500000000', 'ether'),
    },
    farming: {
      address: '0xf4e77E5Da47AC3125140c470c71cBca77B5c638c',
      rewardsDistribution: '0xc783df8a850f42e7F7e57013759C285caa701eB6',
      tokenAmountForDeFiRewards: toWei('123000', 'ether')
    },
  }
};
