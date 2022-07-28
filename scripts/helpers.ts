import 'dotenv/config';
import hre from 'hardhat';
import {Provider} from '@ethersproject/providers';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

const {INFURA_ID} = process.env;
const {ethers} = hre;

export const isLocalNetwork = (): boolean => ['buidlerevm', 'localhost'].includes(hre.network.name);

export const getProvider = (): Provider => {
  if (isLocalNetwork()) {
    // const currentProvider = new hre.Web3.providers.HttpProvider('http://localhost:8545');
    // hre.web3.setProvider(new hre.Web3.providers.HttpProvider('http://localhost:8545'));
    return new ethers.providers.WebSocketProvider('ws://localhost:8545');
  } else {
    return new ethers.providers.JsonRpcProvider(`https://kovan.infura.io/v3/${INFURA_ID}`);
  }
};

export const oneYear = 60 * 60 * 24 * 365;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getArtifacts = (hre: HardhatRuntimeEnvironment, ...contractsNames: string[]): any[] => {
  return contractsNames.map(name => hre.artifacts.readArtifactSync(name));
};
