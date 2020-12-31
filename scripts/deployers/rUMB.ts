import CONFIG from '../../config/config';
import hre from 'hardhat';

const { ethers } = hre;

export const deployUMB = async (owner: string) => {
  const Contract = await ethers.getContractFactory('rUMB');
  const {initialHolder, initialBalance, maxAllowedTotalSupply, name, symbol} = CONFIG.UMB

  const contract = await Contract.deploy(
    initialHolder,
    initialBalance,
    owner,
    maxAllowedTotalSupply,
    name,
    symbol
  );

  await contract.deployed();
  console.log('UMB:', contract.address);
  return contract;
};
