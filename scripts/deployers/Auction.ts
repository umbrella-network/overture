import CONFIG from '../../config/config';
import {constructorAbi} from '../helpers';
import hre from 'hardhat';

const { ethers } = hre;

export const deployAuction = async (owner: string, token: string | undefined = CONFIG.UMB.address) => {
  const Contract = await ethers.getContractFactory('Auction');
  const contract = await Contract.deploy(owner, token);
  await contract.deployed();

  console.log('Auction:', contract.address);

  const constructorTypes = ['address', 'address'];
  const constructorArgs = [owner, token];

  console.log('constructor abi, use it to validate Auction contract:');
  console.log(constructorAbi(constructorTypes, constructorArgs));

  return contract;
};
