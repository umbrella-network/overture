import hre from 'hardhat';
import {ethers} from 'ethers';
import {oneMonth, oneYear} from '../scripts/helpers';
import {ConfigType} from './config';

const {toWei} = hre.web3.utils;

const dummyAddress = (n: string | number) => `0x${n.toString().padStart(40, '0')}`;

export const stagingConfig: ConfigType = {
  env: 'staging',
  contractRegistry: {},
  multiSig: {
    address: '0xD9431D8D58cb47DBE6f065caBd387303323E8c27',
    owners: [
      {address: '0x66f13FDceed822E74b6a1e08e082Fa699fF36454', power: 5},
    ],
    requiredPower: 5
  },
  UMB: {
    address: '0x9Fd318bFb46D4453c72aa96dD76fCc9b8Cf2EFE9',
    maxAllowedTotalSupply: hre.web3.utils.toWei('500000000', 'ether'),
    name: 'Umbrella',
    symbol: 'UMB',
    initialBalance: '0',
    initialHolder: ethers.constants.AddressZero
  },
  auction: {
    address: '0xb999782a160903386A95F4bbB2423Ab1d782dc36',
    amountOfTokensForAuction: toWei('50000000', 'ether')
  },
  stage1: {
    rUmb1: {
      address: '0x41d122D68FAd7DFE4b7B20f81E7aA600a739D9de',
      initialBalance: '0',
      initialHolder: ethers.constants.AddressZero,
      rewardId: 1,
      swapDuration: 60 * 60 * 24 * 365 / 2,
      maxAllowedTotalSupply: toWei('500000000', 'ether'),
    },
    farming: {
      address: '0x424c513301f868F42F6188A85CE22EA55fF31064',
      // who can notify about reward and start whole farming process:
      rewardsDistribution: '0x66f13FDceed822E74b6a1e08e082Fa699fF36454',
      tokenAmountForDeFiRewards: toWei('45833333', 'ether')
    },
    Rewards: {
      address: '0xFbf55A88CFb784c0a3843Fd541BBbacCA0008B5A',
      data: [
        {
          participant: dummyAddress(1), // 'node found address',
          amount: toWei('50000000', 'ether'),
          duration: oneYear * 4
        },
        {
          participant: dummyAddress(2), // 'partner found address',
          amount: toWei('50000000', 'ether'),
          duration: oneYear * 4
        },
        {
          participant: dummyAddress(3), // 'development found address',
          amount: toWei('50000000', 'ether'),
          duration: oneYear * 4
        },
        {
          participant: dummyAddress(4), // 'contributors address',
          amount: toWei('50000000', 'ether'),
          duration: oneMonth * 18
        },
        {
          participant: dummyAddress(5), // 'Founding Team address',
          amount: toWei('51666667', 'ether'),
          duration: oneYear * 4,
          bulk: 10
        },
      ],
      startTime: Date.UTC(2021, 1, 21)
    }
  }
};
