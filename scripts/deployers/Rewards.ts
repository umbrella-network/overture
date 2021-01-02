import hre from 'hardhat';

const { ethers } = hre;

export const deployRewards = async (owner: string) => {
  const Rewards = await ethers.getContractFactory('Rewards');
  const rewards = await Rewards.deploy(owner);
  await rewards.deployed();

  console.log('deployed Rewards:', rewards.address);
  return rewards;
};
