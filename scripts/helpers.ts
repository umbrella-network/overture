import 'dotenv/config';
import hre from 'hardhat';
import {Contract} from '@ethersproject/contracts';
import {Log, Provider, TransactionReceipt} from '@ethersproject/providers';
import CONFIG from '../config/config';

const {INFURA_ID} = process.env;
const {ethers, getNamedAccounts} = hre;

export const validationMark = (valid: boolean | undefined = undefined): string => {
  if (valid === undefined) {
    return '✖✖✖✖ looks like something is missing ✖✖✖✖';
  }

  return valid ? 'OK ✓' : ' ✖✖✖✖ F A I L ✖✖✖✖';
};

export const isLocalNetwork = (): boolean => ['buidlerevm', 'localhost'].includes(hre.network.name);

export const getDefaultOwner = async (): Promise<string> => {
  const {deployer} = await getNamedAccounts();
  return CONFIG.multiSig.address || deployer;
};

export const getProvider = (): Provider => {
  if (isLocalNetwork()) {
    // const currentProvider = new hre.Web3.providers.HttpProvider('http://localhost:8545');
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
  return receipt;
};

export const toBytes32 = (str: string): string => {
  const bytes = Buffer.from(str).toString('hex');
  return `0x${bytes}${'0'.repeat(64 - bytes.length)}`;
};

export const constructorAbi = (types: string[], values: any[]): string => {
  return ethers.utils.defaultAbiCoder.encode(types, values).replace('0x', '');
};

const extractDataFromIndexedTopicLog = (
  logName: string,
  dataTypes: Record<string, string>[],
  logs: Log[]
): Record<string, any> | undefined => {
  let found: string[] = [];
  const types: string[] = dataTypes.reduce((acc: string[], rec) => acc.concat(Object.values(rec)[0]), []);
  const nameHash = ethers.utils.keccak256(Buffer.from(`${logName}(${types.join(',')})`));

  logs.forEach(log => {
    if (log.topics && !found && log.topics[0] === nameHash) {
      found = log.topics.slice(0);
    }
  });

  if (found.length === 0) {
    return;
  }

  return dataTypes.reduce((acc, rec, i) => {
    const param = Object.keys(rec)[0];
    const type = rec[param];

    switch (type) {
      case 'uint':
      case 'uint256':
        acc[param] = ethers.BigNumber.from(found[i + 1]);
        break;
      default:
        acc[param] = found[i + 1];
    }

    return acc;
  }, <Record<string, any>>{});
};

export const checkTxSubmission = (multiSig: Contract, receipt: TransactionReceipt | undefined): string => {
  if (!receipt) {
    validationMark(false);
    throw Error('there is no receipt');
  }

  const logSubmission = extractDataFromIndexedTopicLog('LogSubmission', [{transactionId: 'uint256'}], receipt!.logs);
  return logSubmission!.transactionId.toString();
};

export const wasTxExecutedByMultiSig = async (multiSig: Contract, transactionId: string): Promise<boolean> => {
  const executed = await multiSig.isExceuted(transactionId);
  console.log('MultiSig Tx ID for mint for DeFi:', transactionId);
  console.log('Tx need additional owners to confirm:', !executed);
  console.log('Tx details:', await multiSig.getTransaction(transactionId));
  return executed;
};

export const oneMonth = 60 * 60 * 24 * 365 / 12;

export const oneYear = 60 * 60 * 24 * 365;

export const currentTimestamp = Math.round(Date.now() / 1000);

export const timestamp = ():number => Math.round(Date.now() / 1000);

export const getArtifacts = (...contractsNames: string[]): any[] => {
  return contractsNames.map(name =>
    require(`${__dirname}/../artifacts/contracts/${name}.sol/${name}.json`)
  );
};
