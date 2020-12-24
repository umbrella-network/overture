import 'dotenv/config';
import "@nomiclabs/hardhat-waffle";

const { INFURA_ID, STAGING_PK, NODE_ENV } = process.env;


// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      blockGasLimit: 80000000
    },
    localhost: {
      blockGasLimit: 80000000
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${INFURA_ID}`,
      accounts: STAGING_PK ? [STAGING_PK] : [],
      chainId: 42,
      gasPrice: 1000000000
    },
  },
  gasReporter: {
    gasPrice: 1,
    currency: 'USD'
  },
  paths: {
    sources: './contracts',
    tests: './test',
    artifacts: './artifacts'
  },
  solidity: {
    compilers: [
      {
        version: "0.7.5"
      },
    ]
  },
};

