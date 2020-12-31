import CONFIG from '../../config/config';
import hre from 'hardhat';
import UmbMultiSig from "../../artifacts/contracts/UmbMultiSig.sol/UmbMultiSig.json";
import {getProvider, validationMark} from "../helpers";
import {Contract} from "@ethersproject/contracts";

const { ethers, getNamedAccounts } = hre;

export const multiSigContract = async (): Promise<Contract> => {
  if (!CONFIG.multiSig.address) {
    throw Error('CONFIG.multiSig.address is empty')
  }

  const {deployer} = await getNamedAccounts();
  return new ethers.Contract(CONFIG.multiSig.address, UmbMultiSig.abi, getProvider()).connect(deployer);
}

export const deployUmbMultiSig = async (libStrings: string): Promise<Contract> => {
  const {owners, powers, requiredPower} = CONFIG.multiSig

  const Contract = await ethers.getContractFactory('UmbMultiSig', {
    libraries: {
      Strings: libStrings
    }
  });

  const contract = await Contract.deploy(owners, powers, requiredPower);
  await contract.deployed();
  console.log('deployed UmbMultiSig:', contract.address);

  for (let i=0; i < owners.length; i++) {
    const power = await contract.ownersPowers(owners[i])
    const check = power.toString() === powers[i].toString(10)

    console.log('check for power', owners[i], power.toString(), '==', powers[i], validationMark(check))
    if (!check) {
      throw Error('Oops...')
    }
  }

  return contract;
};
