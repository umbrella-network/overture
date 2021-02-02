import hre from 'hardhat';
import {Contract} from '@ethersproject/contracts';

import CONFIG from '../../config/config';
import {constructorAbi, getArtifacts, getProvider} from '../helpers';

const { ethers } = hre;
const [Umb] = getArtifacts('UMB')

export const getUmbContract = async (): Promise<Contract> => {
  if (!CONFIG.UMB.address) {
    throw Error('UMB address is empty');
  }

  const deployer = (await ethers.getSigners())[<number>hre.config.namedAccounts.deployer];
  return new ethers.Contract(CONFIG.UMB.address, Umb.abi, getProvider()).connect(deployer);
};

export const deployUMB = async (owner: string): Promise<Contract> => {
  const Contract = await ethers.getContractFactory('UMB');
  const {initialHolder, initialBalance, maxAllowedTotalSupply, name, symbol} = CONFIG.UMB;

  const constructorTypes = [
    'address',
    'address',
    'uint256',
    'uint256',
    'string',
    'string'
  ];

  const constructorArgs = [
    owner,
    initialHolder,
    initialBalance,
    maxAllowedTotalSupply,
    name,
    symbol
  ];

  const contract = await Contract.deploy(...constructorArgs);

  await contract.deployed();
  console.log('deployed UMB:', contract.address);
  console.log('constructor abi, use it to validate UMB contract:');
  console.log(constructorAbi(constructorTypes, constructorArgs));
  return contract;
};
