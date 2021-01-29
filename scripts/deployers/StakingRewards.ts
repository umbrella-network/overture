import CONFIG from '../../config/config';
import hre from 'hardhat';
import {constructorAbi} from '../helpers';

const { ethers } = hre;

export const deployStakingRewards = async (owner: string, rUmb: string | undefined = CONFIG.stage1.rUmb.address) => {
  const contractName = 'StakingRewards';

  const Contract = await ethers.getContractFactory(contractName);
  const rewardsDistribution = CONFIG.stage1.farming.rewardsDistribution || CONFIG.multiSig.address;

  const constructorTypes = ['address', 'address', 'address', 'address'];
  const constructorArgs = [owner, rewardsDistribution, CONFIG.UMB.address, rUmb];

  const contract = await Contract.deploy(...constructorArgs);

  await contract.deployed();
  console.log('deployed StakingRewards:', contract.address);
  console.log('reward distributor is:', rewardsDistribution);


  console.log('constructor abi, use it to validate', contractName, 'contract:');
  console.log(constructorAbi(constructorTypes, constructorArgs));

  return contract;
};
