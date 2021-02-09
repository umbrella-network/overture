import 'dotenv/config';
import hre from 'hardhat';
import {Provider} from '@ethersproject/providers';

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

export const oneMonth = 60 * 60 * 24 * 365 / 12;

export const oneYear = 60 * 60 * 24 * 365;

export const currentTimestamp = Math.round(Date.now() / 1000);

export const timestamp = (): number => Math.round(Date.now() / 1000);

export const getArtifacts = (...contractsNames: string[]): any[] => {
  return contractsNames.map(name =>
    require(`${__dirname}/../artifacts/contracts/${name}.sol/${name}.json`)
  );
};
