import CONFIG from '../../config/config';
import hre from 'hardhat';
import {constructorAbi} from "../helpers";

const { ethers } = hre;

export const deployRUMB1 = async (owner: string, libStrings: string) => {
  const contractName = 'rUMB';
  const Contract = await ethers.getContractFactory(contractName, {
    libraries: {
      Strings: libStrings
    }
  });

  const {stage1} = CONFIG

  const constructorTypes = [
    'address',
    'address',
    'uint256',
    'uint256',
    'uint256',
    'uint256',
    'string',
    'string',
  ];

   const constructorArgs = [
     owner,
     stage1.rUmb.initialHolder,
     stage1.rUmb.initialBalance,
     stage1.rUmb.maxAllowedTotalSupply,
     stage1.rUmb.rewardId,
     stage1.rUmb.swapDuration,
     CONFIG.UMB.name,
     CONFIG.UMB.symbol,
   ]

  const contract = await Contract.deploy(...constructorArgs);

  await contract.deployed();
  console.log('Reward Token:', contract.address);
  console.log('________name:', await contract.name());
  console.log('______symbol:', await contract.symbol());

  console.log('constructor abi, use it to validate', contractName, 'contract:')
  console.log(constructorAbi(constructorTypes, constructorArgs))

  return contract;
};
