import hre from 'hardhat';

const { ethers } = hre;

export const deployLibStrings = async () => {
  const Contract = await ethers.getContractFactory('Strings');
  const contract = await Contract.deploy();
  await contract.deployed();

  console.log('Strings:', contract.address);
  return contract;
};
