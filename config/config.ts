import {ethers} from "ethers";
import hre from 'hardhat';
import {currentTimestamp, oneMonth} from "../scripts/helpers";

const env = process.env.NODE_ENV || 'development';
const {toWei} = hre.web3.utils
console.log('env', env);

export type ConfigType = {
  env: string
  contractRegistry: {
    address?: string
  },
  libs: {
    strings?: string
  }
  multiSig: {
    address?: string,
    owners: string[],
    powers: number[],
    requiredPower: number
  },
  UMB: {
    address?: string
    name: string
    symbol: string,
    initialHolder: string
    initialBalance: string  // eg. for liquidity provider
    maxAllowedTotalSupply: string
  },
  auction: {
    address?: string
    amountOfTokensForAuction: string
  },
  stage1: {
    rUmb: {
      address?: string
      rewardId: number,
      initialHolder: string
      initialBalance: string
      maxAllowedTotalSupply: string
      swapDuration: number
    }
    farming: {
      address?: string,
      rewardsDistribution: string   // it can be multisig or any account
      tokenAmountForDeFiRewards: string
    },
    rewards: {
      address?: string
      startTime: number
      participants: string[]
      amounts: string[]
      durations: number[]
    }
  },
}

const envConfig: Record<string, ConfigType> = {
  development: {
    env: 'development',
    contractRegistry: {},
    libs: {
      strings: '0xA48096237053a0B74E15cEd6FA33F7c96A5acf50'
    },
    multiSig: {
      address: '0x1256eBA4d0a7A38D10BaF4F61775ba491Ce7EE25',
      owners: [
        '0xead9c93b79ae7c1591b1fb5323bd777e86e150d4' // one of defined addresses in local node
      ],
      powers: [5],
      requiredPower: 5
    },
    UMB: {
      address: '0x77B0b5636fEA30eA79BB65AeCCdb599997A849A8',
      maxAllowedTotalSupply: toWei('500000000', 'ether'),
      name: 'Umbrella',
      symbol: 'UMB',
      initialBalance: '0', // toWei('150000000', 'ether'), for liquidity
      initialHolder: ethers.constants.AddressZero
    },
    auction: {
      // address: '0x6D3540a9F1a769bfd91A4A33169a8361aa82dC0F',
      amountOfTokensForAuction: toWei('50000000', 'ether')
    },
    stage1: {
      rUmb: {
        initialBalance: '0',
        initialHolder: ethers.constants.AddressZero,
        rewardId: 1,
        swapDuration: oneMonth * 6,
        maxAllowedTotalSupply: toWei('500000000', 'ether'),
      },
      farming: {
        rewardsDistribution: '0x1256eBA4d0a7A38D10BaF4F61775ba491Ce7EE25',
        tokenAmountForDeFiRewards: toWei('123000', 'ether')
      },
      rewards: {
        participants: ['0x66f13FDceed822E74b6a1e08e082Fa699fF36454'],
        amounts: [toWei('12', 'ether')],
        durations: [oneMonth],
        startTime: currentTimestamp
      }
    }
  },

  staging: {
    env: 'staging',
    contractRegistry: {},
    libs: {},
    multiSig: {
      owners: [],
      powers: [],
      requiredPower: 0
    },
    UMB: {
      maxAllowedTotalSupply: hre.web3.utils.toWei('500000000', 'ether'),
      name: 'Umbrella',
      symbol: 'UMB',
      initialBalance: '0',
      initialHolder: ethers.constants.AddressZero
    },
    auction: {
      amountOfTokensForAuction: toWei('50000000', 'ether')
    },
    stage1: {
      rUmb: {
        initialBalance: '0',
        initialHolder: ethers.constants.AddressZero,
        rewardId: 1,
        swapDuration: 60 * 60 * 24 * 365 / 2,
        maxAllowedTotalSupply: toWei('500000000', 'ether'),
      },
      farming: {
        rewardsDistribution: ethers.constants.AddressZero,
        tokenAmountForDeFiRewards: '0'
      },
      rewards: {
        participants: [],
        amounts: [],
        durations: [],
        startTime: Date.UTC(2021, 1, 21)
      }
    }
  }
};

export default <ConfigType>envConfig[env];
