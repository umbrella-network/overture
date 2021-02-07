import hre from 'hardhat';

import CONFIG from '../config/config';
import {deployUmbMultiSig} from './deployers/UmbMultiSig';
import {deployUMB} from './deployers/UMB';
import {breakLog, currentTimestamp} from './helpers';
import {deployRUMB1} from './deployers/rUMB1';
import {deployStakingRewards} from './deployers/StakingRewards';

const {ethers, getNamedAccounts} = hre;

const {FORCE} = process.env

async function main() {
  const {deployer} = await getNamedAccounts();
  const deployerSigner = (await ethers.getSigners())[<number>hre.config.namedAccounts.deployer];

  if (!deployerSigner) {
    const pk = ethers.Wallet.createRandom()
    console.log('random PK', pk.privateKey);
    console.log('mnemonic:', pk.mnemonic);
    console.log('address:', await pk.getAddress());
    throw Error('deployer PK is not set, check `hardhat.config` and setup .env');
  }

  console.log(`\n\n${'-'.repeat(80)}\nSCRIPT STARTS AT: ${currentTimestamp}\n\n`);
  console.log('ENV:', CONFIG.env);
  console.log('DEPLOYING FROM ADDRESS:', deployer, '\n\n');
  breakLog();

  if (!FORCE && CONFIG.multiSig.address) {
    console.log('MultiSig address is already deployed', CONFIG.multiSig.address);
  } else {
    await deployUmbMultiSig();
  }

  breakLog();

  let umbAddress = CONFIG.UMB.address;
  if (!FORCE && umbAddress) {
    console.log('UMB IS ALREADY DEPLOYED under', umbAddress);
  } else {
    umbAddress = (await deployUMB(deployer)).address;
  }

  breakLog();

  let rUmbAddress = CONFIG.stage1.rUmb1.address
  if (!FORCE && rUmbAddress) {
    console.log('rUMB1 IS ALREADY DEPLOYED under', rUmbAddress);
  } else {
    rUmbAddress = (await deployRUMB1(deployer)).address;
  }

  breakLog();

  if (!FORCE && CONFIG.stage1.farming.address) {
    console.log('FARMING IS ALREADY DEPLOYED under', CONFIG.stage1.farming.address);
  } else {
    await deployStakingRewards(
      deployer,
      CONFIG.UMB.address || umbAddress,
      CONFIG.stage1.rUmb1.address || rUmbAddress,
    );
  }

  console.warn('NEW ADDRESSES ARE SAVED TO CONFIG FILE')
}

main()
  .then(() => {
    console.log(`\n\nDONE.\n${'='.repeat(80)}\n`);
    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
