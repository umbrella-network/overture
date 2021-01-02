import CONFIG from '../../config/config';
import hre from 'hardhat';

const { ethers } = hre;

export const deployRUMB1 = async (owner: string, libStrings: string) => {
  const Contract = await ethers.getContractFactory('rUMB', {
    libraries: {
      Strings: libStrings
    }
  });

  const {stage1} = CONFIG

  const contract = await Contract.deploy(
    owner,
    stage1.rUmb.initialHolder,
    stage1.rUmb.initialBalance,
    stage1.rUmb.maxAllowedTotalSupply,
    stage1.rUmb.rewardId,
    stage1.rUmb.swapDuration,
    CONFIG.UMB.name,
    CONFIG.UMB.symbol,
  );

  await contract.deployed();
  console.log('Reward Token:', contract.address);
  console.log('________name:', await contract.name());
  console.log('______symbol:', await contract.symbol());
  return contract;
};
