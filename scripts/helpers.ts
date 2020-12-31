import 'dotenv/config';
import hre from 'hardhat';
import {Provider} from '@ethersproject/providers'
import CONFIG from "../config/config";
import {TransactionReceipt} from "@ethersproject/providers";

const { INFURA_ID } = process.env;
const { ethers, getNamedAccounts } = hre;

export const validationMark = (valid: boolean | undefined = undefined) => {
  if (valid === undefined) {
    return '✖✖✖✖ looks like something is missing ✖✖✖✖'
  }

  return valid ? 'OK ✓' : ' ✖✖✖✖ F A I L ✖✖✖✖'
}

export const isLocalNetwork = () => ['buidlerevm', 'localhost'].includes(hre.network.name);

export const getDefaultOwnerBasedOnConfig = async (): Promise<string | undefined> => {
  if (CONFIG.multiSig.useIt) {
    return CONFIG.multiSig.address
  }

  const {deployer} = await getNamedAccounts();
  return CONFIG.defaultOwner || deployer
}

export const getProvider = () => {
  if (isLocalNetwork()) {
    const currentProvider = new hre.Web3.providers.HttpProvider('http://localhost:8545');
    // hre.web3.setProvider(new hre.Web3.providers.HttpProvider('http://localhost:8545'));
    return new ethers.providers.WebSocketProvider('ws://localhost:8545');
  } else {
    return new ethers.providers.JsonRpcProvider(`https://kovan.infura.io/v3/${INFURA_ID}`);
  }
};

export const waitForTx = async (txHash: string, provider: Provider): Promise<TransactionReceipt | undefined> => {
  if (hre.network.name === 'buidlerevm') {
    return undefined;
  }

  console.log('waiting for tx to be mined...', txHash);
  const receipt = await provider.waitForTransaction(txHash);

  if (receipt.status !== 1) {
    console.log(receipt);
    throw Error('rejected tx');
  }

  console.log('...success');
  return receipt
};

export const toBytes32 = (str: string) => {
  const bytes = Buffer.from(str).toString('hex');
  return `0x${bytes}${'0'.repeat(64 - bytes.length)}`;
};

export const constructorAbi = (types: string[], values: any[]) => {
  return ethers.utils.defaultAbiCoder.encode(types, values).replace('0x', '')
}
