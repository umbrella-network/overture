import CONFIG from '../../config/config';
import hre from 'hardhat';
import {Contract} from '@ethersproject/contracts';

import {constructorAbi, getArtifacts, getProvider} from '../helpers';

const {ethers} = hre;
const [StakingRewards] = getArtifacts('StakingRewards');

export const getStakingRewardsContract = async (): Promise<Contract> => {
  if (!CONFIG.stage1.farming.address) {
    throw Error('StakingRewards address is empty');
  }

  const deployer = (await ethers.getSigners())[<number>hre.config.namedAccounts.deployer];
  return new ethers.Contract(CONFIG.stage1.farming.address, StakingRewards.abi, getProvider()).connect(deployer);
};

export const deployStakingRewards = async (owner: string, umb: string, rUmb: string): Promise<Contract> => {
  const contractName = 'StakingRewards';

  const Contract = await ethers.getContractFactory(contractName);
  const rewardsDistribution = CONFIG.stage1.farming.rewardsDistribution || CONFIG.multiSig.address || owner;

  const constructorTypes = ['address', 'address', 'address', 'address'];
  const constructorArgs = [owner, rewardsDistribution, umb, rUmb];

  const contract = await Contract.deploy(...constructorArgs);

  await contract.deployed();
  console.log('deployed StakingRewards:', contract.address);
  console.log('reward distributor is:', rewardsDistribution);

  console.log('constructor abi, use it to validate', contractName, 'contract:');
  console.log(constructorAbi(constructorTypes, constructorArgs));

  return contract;
};
