import {ethers} from "ethers";
import hre from 'hardhat';
import {currentTimestamp, oneMonth, oneYear} from "../scripts/helpers";

const env = process.env.NODE_ENV || 'development';
const {toWei} = hre.web3.utils
console.log('env', env);

const dummyAddress = (n: string | number) => `0x${n.toString().padStart(40, '0')}`

export type RewardsData = {
  participant: string
  amount: string
  duration: number
}

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
    owners: { address: string, power: number }[],
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
      rewardsDistribution?: string   // default is MultiSig
      tokenAmountForDeFiRewards: string
    },
    umbRewards: {
      address?: string
      startTime: number
      data: RewardsData[]
    }
  },
}

const envConfig: Record<string, ConfigType> = {
  development: {
    env: 'development',
    contractRegistry: {},
    libs: {
      strings: '0xf4e77E5Da47AC3125140c470c71cBca77B5c638c'
    },
    multiSig: {
      // address: '0xf784709d2317D872237C4bC22f867d1BAe2913AB',
      owners: [
        {address: '0xc783df8a850f42e7F7e57013759C285caa701eB6', power: 5}, // one of defined addresses in local node
        {address: '0xead9c93b79ae7c1591b1fb5323bd777e86e150d4', power: 5}
      ],
      requiredPower: 5
    },
    UMB: {
      // address: '0x3619DbE27d7c1e7E91aA738697Ae7Bc5FC3eACA5',
      maxAllowedTotalSupply: toWei('500000000', 'ether'),
      name: 'Umbrella',
      symbol: 'UMB',
      initialBalance: '0', // toWei('150000000', 'ether'), for liquidity
      initialHolder: ethers.constants.AddressZero
    },
    auction: {
      // address: '0x038B86d9d8FAFdd0a02ebd1A476432877b0107C8',
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
        // rewardsDistribution: '0x1256eBA4d0a7A38D10BaF4F61775ba491Ce7EE25',
        tokenAmountForDeFiRewards: toWei('123000', 'ether')
      },
      umbRewards: {
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
  },

  staging: {
    env: 'staging',
    contractRegistry: {},
    libs: {
      strings: '0x142821188cA3954360f48fAdaD8D32b2b38DB022'
    },
    multiSig: {
      address: '0xA1a93C002744868da73eDe3f9F7eC244Ba782f65',
      owners: [
        { address: '0x66f13FDceed822E74b6a1e08e082Fa699fF36454', power: 5 },
      ],
      requiredPower: 5
    },
    UMB: {
      address: '0x5D01d44fC4A028a8FAb9cB49cc161A20727F985F',
      // 0000000000000000000000002663bfc8d0c833f602f6ff74482c113187cb0e1e000000000000000000000000e1cdce9a678e84aa73d3266176c6e11b3edc4f67
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
      rUmb: {
        address: '0xb81f69E38669e18cfF763D7ABB77bD8BC6092Ee4',
        initialBalance: '0',
        initialHolder: ethers.constants.AddressZero,
        rewardId: 1,
        swapDuration: 60 * 60 * 24 * 365 / 2,
        maxAllowedTotalSupply: toWei('500000000', 'ether'),
      },
      farming: {
        address: '0x7b471d144032a41D0DcE7678c4fCF351Ce30eA07',
        // rewardsDistribution: '0x66f13FDceed822E74b6a1e08e082Fa699fF36454', // who can notify about reward and start whole farming process
        tokenAmountForDeFiRewards: toWei('45833333', 'ether')
      },
      umbRewards: {
        address: '0x805733232f6BCE0cf03E5A1D140fE41D7C164060',
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
            duration: oneYear * 4
          },
        ],
        startTime: Date.UTC(2021, 1, 21)
      }
    }
  },

  launch: {
    env: 'staging',
    contractRegistry: {},
    libs: {},
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
      amountOfTokensForAuction: toWei('50000000', 'ether') //they will go directly to auction contract
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
        tokenAmountForDeFiRewards: toWei('45833333', 'ether')
      },
      umbRewards: {
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
  }
};

export default <ConfigType>envConfig[env];
