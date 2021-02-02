import hre from 'hardhat';
import {Contract} from '@ethersproject/contracts';

import CONFIG from '../../config/config';
import {constructorAbi, getArtifacts, getProvider} from '../helpers';

const {ethers} = hre;
const [rUmb] = getArtifacts('rUMB')

export const getRUmb1Contract = async (): Promise<Contract> => {
  if (!CONFIG.stage1.rUmb1.address) {
    throw Error('rUMB1 address is empty');
  }

  const deployer = (await ethers.getSigners())[<number>hre.config.namedAccounts.deployer];
  return new ethers.Contract(CONFIG.stage1.rUmb1.address, rUmb.abi, getProvider()).connect(deployer);
};

export const deployRUMB1 = async (owner: string): Promise<Contract> => {
  const contractName = 'rUMB';
  const Contract = await ethers.getContractFactory(contractName);

  const {stage1} = CONFIG;

  const constructorTypes = [
    'address',
    'address',
    'uint256',
    'uint256',
    'uint256',
    'string',
    'string',
  ];

  const constructorArgs = [
    owner,
    stage1.rUmb1.initialHolder,
    stage1.rUmb1.initialBalance,
    stage1.rUmb1.maxAllowedTotalSupply,
    stage1.rUmb1.swapDuration,
    `${CONFIG.UMB.name} Reward #${stage1.rUmb1.rewardId}`,
    `r${CONFIG.UMB.symbol}${stage1.rUmb1.rewardId}`,
  ];

  const contract = await Contract.deploy(...constructorArgs);

  await contract.deployed();
  console.log('Reward Token:', contract.address);
  console.log('________name:', await contract.name());
  console.log('______symbol:', await contract.symbol());

  console.log('constructor abi, use it to validate', contractName, 'contract:');
  console.log(constructorAbi(constructorTypes, constructorArgs));

  return contract;
};
