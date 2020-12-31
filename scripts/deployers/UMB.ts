import CONFIG from '../../config/config';
import hre from 'hardhat';
import {Contract} from "@ethersproject/contracts";
import Umb from "../../artifacts/contracts/UMB.sol/UMB.json";
import {getProvider} from "../helpers";

const { ethers, getNamedAccounts } = hre;

export const UmbContract = async (address: string | undefined = CONFIG.UMB.address): Promise<Contract> => {
  if (!address) {
    throw Error('UMB address is empty')
  }

  const {deployer} = await getNamedAccounts();
  return new ethers.Contract(address, Umb.abi, getProvider()).connect(deployer);
}

export const deployUMB = async (owner: string) => {
  const Contract = await ethers.getContractFactory('UMB');
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
