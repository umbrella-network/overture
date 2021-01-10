import hre from 'hardhat';
import {constructorAbi} from "../helpers";

const { ethers } = hre;

export const deployRewards = async (owner: string) => {
  const contractName = 'Rewards'
  const Rewards = await ethers.getContractFactory(contractName);
  const rewards = await Rewards.deploy(owner);
  await rewards.deployed();

  console.log('deployed Rewards:', rewards.address);

  console.log('constructor abi, use it to validate', contractName, 'contract:')
  console.log(constructorAbi(['address'], [owner]))

  return rewards;
};
