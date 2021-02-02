import {developmentConfig} from './development';
import {stagingConfig} from './staging';
import {liveConfig} from './live';

const env = process.env.NODE_ENV || 'development';
console.log('env', env);

export type RewardsData = {
  participant: string,
  amount: string,
  duration: number,
  bulk?: number
}

export type ConfigType = {
  env: string,
  contractRegistry: {
    address?: string
  },
  multiSig: {
    address?: string,
    owners: { address: string, power: number }[],
    requiredPower: number
  },
  UMB: {
    address?: string,
    name: string,
    symbol: string,
    initialHolder: string,
    initialBalance: string,  // eg. for liquidity provider
    maxAllowedTotalSupply: string
  },
  auction: {
    address: string,
    amountOfTokensForAuction: string
  },
  stage1: {
    rUmb1: {
      address?: string,
      rewardId: number,
      initialHolder: string,
      initialBalance: string,
      maxAllowedTotalSupply: string,
      swapDuration: number
    },
    farming: {
      address?: string,
      rewardsDistribution?: string,   // default is MultiSig
      tokenAmountForDeFiRewards: string
    },
    Rewards: {
      address?: string,
      startTime: number,
      data: RewardsData[]
    }
  },
}

const envConfig: Record<string, ConfigType> = {
  development: developmentConfig,
  staging: stagingConfig,
  launch: liveConfig
}

export default envConfig[env];
