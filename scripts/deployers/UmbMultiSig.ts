import CONFIG from '../../config/config';
import hre from 'hardhat';
import UmbMultiSig from "../../artifacts/contracts/UmbMultiSig.sol/UmbMultiSig.json";
import {getProvider, validationMark} from "../helpers";
import {Contract} from "@ethersproject/contracts";

const { ethers, getNamedAccounts } = hre;
const { BigNumber } = ethers;

export const multiSigContract = async (): Promise<Contract> => {
  if (!CONFIG.multiSig.address) {
    throw Error('CONFIG.multiSig.address is empty')
  }

  return new ethers.Contract(CONFIG.multiSig.address, UmbMultiSig.abi, getProvider());
}

export const deployUmbMultiSig = async (libStrings: string): Promise<Contract> => {
  const {owners, requiredPower} = CONFIG.multiSig

  const addresses = owners.map(data => data.address)
  const powers = owners.map(data => data.power)

  const Contract = await ethers.getContractFactory('UmbMultiSig', {
    libraries: {
      Strings: libStrings
    }
  });

  const contract = await Contract.deploy(addresses, powers, requiredPower);
  await contract.deployed();
  console.log('deployed UmbMultiSig:', contract.address);

  owners.forEach((data, i) => {
    contract.ownersPowers(data.address).then((power: typeof BigNumber) => {
      const check = power.toString() === data.power.toString(10)

      console.log('check for power', data.address, power.toString(), '==', data.power, validationMark(check))
      if (!check) {
        throw Error('Oops...')
      }
    })
  })

  return contract;
};
