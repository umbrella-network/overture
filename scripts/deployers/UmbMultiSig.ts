import hre from 'hardhat';
import {Contract} from '@ethersproject/contracts';

import CONFIG from '../../config/config';
import {getArtifacts, getProvider} from '../helpers';

const {ethers} = hre;
const [UmbMultiSig] = getArtifacts('UmbMultiSig')

export const multiSigContract = async (): Promise<Contract> => {
  if (!CONFIG.multiSig.address) {
    throw Error('CONFIG.multiSig.address is empty');
  }

  return new ethers.Contract(CONFIG.multiSig.address, UmbMultiSig.abi, getProvider());
};

export const deployUmbMultiSig = async (): Promise<Contract> => {
  const {owners, requiredPower} = CONFIG.multiSig;

  const addresses = owners.map(data => data.address);
  const powers = owners.map(data => data.power);

  const Contract = await ethers.getContractFactory('UmbMultiSig');
  const contract = await Contract.deploy(addresses, powers, requiredPower);
  await contract.deployed();

  console.log('deployed UmbMultiSig:', contract.address);

  return contract;
};
