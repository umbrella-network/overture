import hre from 'hardhat';
import {Contract} from '@ethersproject/contracts';

import {constructorAbi, getArtifacts, getProvider} from '../helpers';
import CONFIG from '../../config/config';

const {ethers} = hre;
const [Rewards] = getArtifacts('Rewards');

export const getRewardsContract = async (): Promise<Contract> => {
  if (!CONFIG.stage1.Rewards.address) {
    throw Error('UMB address is empty');
  }

  const deployer = (await ethers.getSigners())[<number>hre.config.namedAccounts.deployer];
  return new ethers.Contract(CONFIG.stage1.Rewards.address, Rewards.abi, getProvider()).connect(deployer);
};


export const deployRewards = async (owner: string): Promise<Contract> => {
  const contractName = 'Rewards';
  const Rewards = await ethers.getContractFactory(contractName);
  const rewards = await Rewards.deploy(owner);
  await rewards.deployed();

  console.log('deployed Rewards:', rewards.address);

  console.log('constructor abi, use it to validate', contractName, 'contract:');
  console.log(constructorAbi(['address'], [owner]));

  return rewards;
};
