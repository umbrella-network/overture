import CONFIG from '../../config/config';
import hre from 'hardhat';

const { ethers } = hre;

export const deployStakingRewards = async (owner: string, rUmb: string = CONFIG.stage1.rUmb.address!) => {
  const Contract = await ethers.getContractFactory('StakingRewards');
  const rewardsDistribution = CONFIG.stage1.farming.rewardsDistribution || CONFIG.multiSig.address
  const contract = await Contract.deploy(owner, rewardsDistribution, CONFIG.UMB.address, rUmb);

  await contract.deployed();
  console.log('deployed StakingRewards:', contract.address);
  console.log('reward distributor is:', rewardsDistribution);
  return contract;
};
