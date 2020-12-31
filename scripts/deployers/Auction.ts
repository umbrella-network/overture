import CONFIG from '../../config/config';
import {constructorAbi} from '../helpers';
import hre from 'hardhat';

const { ethers } = hre;

export const deployAuction = async (token: string | undefined = CONFIG.UMB.address, owner: string) => {
  const Contract = await ethers.getContractFactory('Auction');
  const contract = await Contract.deploy(token, owner);
  await contract.deployed();

  console.log('Auction:', contract.address);

  const constructorTypes = ['address', 'address']
  const constructorArgs = [token, owner]

  console.log('constructor abi, use it to validate contract:')
  console.log(constructorAbi(constructorTypes, constructorArgs))

  return contract;
};
