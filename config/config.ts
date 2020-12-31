import {ethers} from "ethers";
import hre from 'hardhat';

const env = process.env.NODE_ENV || 'development';
const {toWei} = hre.web3.utils
console.log('env', env);

export type ConfigType = {
  env: string
  defaultOwner: string  // if empty, then multisig or deployer will be used
  contractRegistry: {
    address?: string
  },
  multiSig: {
    useIt: boolean,     // if false, then regular wallet will be used, useful for local development
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
    initialBalance: string
    maxAllowedTotalSupply: string
  },
  auction: {
    address?: string
    tokensForAuction: string
  }
}

const envConfig: Record<string, ConfigType> = {
  development: {
    env: 'development',
    defaultOwner: '0x66f13FDceed822E74b6a1e08e082Fa699fF36454',
    contractRegistry: {
    },
    multiSig: {
      useIt: true,
      address: '0x850Fae11E1313e6C23Db7c2410Ec0985d9Ea325A',
      owners: ['0xead9c93b79ae7c1591b1fb5323bd777e86e150d4'],
      powers: [5],
      requiredPower: 5
    },
    UMB: {
      address: '0x22058276Dd278bD037591805E62E797012d666f6',
      maxAllowedTotalSupply: toWei('500000000', 'ether'),
      name: 'Umbrella',
      symbol: 'UMB',
      initialBalance: '0',
      initialHolder: ethers.constants.AddressZero
    },
    auction: {
      address: '0x6D3540a9F1a769bfd91A4A33169a8361aa82dC0F',
      tokensForAuction: toWei('50000000', 'ether')
    }
  },
  staging: {
    env: 'staging',
    defaultOwner: '0x66f13FDceed822E74b6a1e08e082Fa699fF36454',
    contractRegistry: {
    },
    multiSig: {
      useIt: false,
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
      tokensForAuction: toWei('50000000', 'ether')
    }
  }
};

export default <ConfigType>envConfig[env];
