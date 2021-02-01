import 'dotenv/config';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-web3';
import '@nomiclabs/hardhat-solhint';
import 'solidity-coverage';

import 'hardhat-deploy';
import 'hardhat-deploy-ethers';
import 'hardhat-gas-reporter';

import {HardhatUserConfig} from 'hardhat/types';

const { INFURA_ID, DEPLOYER_PK } = process.env;

const balance = '1000' + '0'.repeat(18);

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  namedAccounts: {
    deployer: 0,
    multiSigOwner1: 1
  },
  networks: {
    hardhat: {
      blockGasLimit: 80000000,
      accounts: [
        // 0xc783df8a850f42e7f7e57013759c285caa701eb6
        {balance, privateKey: '0xc5e8f61d1ab959b397eecc0a37a6517b8e67a0e7cf1f4bce5591f3ed80199122'},
        // 0xead9c93b79ae7c1591b1fb5323bd777e86e150d4
        {balance, privateKey: '0xd49743deccbccc5dc7baa8e69e5be03298da8688a15dd202e20f15d5e0e9a9fb'},
        // 0xe5904695748fe4a84b40b3fc79de2277660bd1d3
        {balance, privateKey: '0x23c601ae397441f3ef6f1075dcb0031ff17fb079837beadaf3c84d96c6f3e569'},
        // 0x2ffd013aaa7b5a7da93336c2251075202b33fb2b
        {balance, privateKey: '0x87630b2d1de0fbd5044eb6891b3d9d98c34c8d310c852f98550ba774480e47cc'},
        {balance, privateKey: '0x275cc4a2bfd4f612625204a20a2280ab53a6da2d14860c47a9f5affe58ad86d4'},
        {balance, privateKey: '0xee9d129c1997549ee09c0757af5939b2483d80ad649a0eda68e8b0357ad11131'}
      ]
    },
    localhost: {
      blockGasLimit: 80000000,
      /* accounts: [
        // 0xc783df8a850f42e7f7e57013759c285caa701eb6
        {balance: '1000000', privateKey: '0xc5e8f61d1ab959b397eecc0a37a6517b8e67a0e7cf1f4bce5591f3ed80199122'},
        // 0xead9c93b79ae7c1591b1fb5323bd777e86e150d4
        {balance: '1000000', privateKey: '0xd49743deccbccc5dc7baa8e69e5be03298da8688a15dd202e20f15d5e0e9a9fb'},
        // 0xe5904695748fe4a84b40b3fc79de2277660bd1d3
        {balance: '1000000', privateKey: '0x23c601ae397441f3ef6f1075dcb0031ff17fb079837beadaf3c84d96c6f3e569'},
        // 0x2ffd013aaa7b5a7da93336c2251075202b33fb2b
        {balance: '1000000', privateKey: '0x87630b2d1de0fbd5044eb6891b3d9d98c34c8d310c852f98550ba774480e47cc'}
      ] // */
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${INFURA_ID}`,
      accounts: DEPLOYER_PK ? [
        DEPLOYER_PK, // deployer, must be super owner for scripts to work
      ] : [],
      chainId: 42,
      gasPrice: 1000000000
    },
  },
  gasReporter: {
    gasPrice: 1,
    currency: 'USD',
    enabled: !!process.env.REPORT_GAS,
    maxMethodDiff: 10,
  },
  paths: {
    sources: './contracts',
    tests: './test',
    artifacts: './artifacts'
  },
  solidity: {
    compilers: [
      {
        version: '0.7.5'
      },
    ]
  },
};

export default config;
