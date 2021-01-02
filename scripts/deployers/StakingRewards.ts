import CONFIG from '../../config/config';
import hre from 'hardhat';

const { ethers } = hre;

export const deployStakingRewards = async (owner: string, rUmb: string = CONFIG.stage1.rUmb.address!) => {
  const Contract = await ethers.getContractFactory('StakingRewards');
  const contract = await Contract.deploy(owner, CONFIG.stage1.farming.rewardsDistribution, CONFIG.UMB.address, rUmb);

  await contract.deployed();
  console.log('deployed StakingRewards:', contract.address);
  return contract;
};
