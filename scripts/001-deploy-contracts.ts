import hre from 'hardhat';

import CONFIG from '../config/config';
import {deployUmbMultiSig} from './deployers/UmbMultiSig';
import {deployUMB} from './deployers/UMB';
import {breakLog, currentTimestamp} from './helpers';
import {deployRUMB1} from './deployers/rUMB';
import {deployRewards} from './deployers/Rewards';
import {deployStakingRewards} from './deployers/StakingRewards';

const {ethers, getNamedAccounts} = hre;

async function main() {
  const {deployer} = await getNamedAccounts();
  const deployerSigner = (await ethers.getSigners())[<number>hre.config.namedAccounts.deployer];

  if (!deployerSigner) {
    throw Error('deployer PK is not set, check `hardhat.config` and setup .env');
  }

  console.log(`\n\n${'-'.repeat(80)}\nSCRIPT STARTS AT: ${currentTimestamp}\n\n`);
  console.log('ENV:', CONFIG.env);
  console.log('DEPLOYING FROM ADDRESS:', deployer, '\n\n');
  breakLog();

  if (CONFIG.multiSig.address) {
    console.log('MultiSig address is already deployed', CONFIG.multiSig.address);
  } else {
    await deployUmbMultiSig();
  }

  breakLog();

  let umbAddress = CONFIG.UMB.address;
  if (umbAddress) {
    console.log('UMB IS ALREADY DEPLOYED under', umbAddress);
  } else {
    umbAddress = (await deployUMB(deployer)).address;
  }

  breakLog();

  let rUmbAddress = CONFIG.stage1.rUmb1.address
  if (rUmbAddress) {
    console.log('rUMB1 IS ALREADY DEPLOYED under', rUmbAddress);
  } else {
    rUmbAddress = (await deployRUMB1(deployer)).address;
  }

  breakLog();

  if (CONFIG.stage1.Rewards.address) {
    console.log('REWARDS IS ALREADY DEPLOYED under', CONFIG.stage1.Rewards.address);
  } else {
    await deployRewards(deployer);
  }

  breakLog();

  if (CONFIG.stage1.farming.address) {
    console.log('FARMING IS ALREADY DEPLOYED under', CONFIG.stage1.farming.address);
  } else {
    await deployStakingRewards(
      deployer,
      CONFIG.UMB.address || umbAddress,
      CONFIG.stage1.rUmb1.address || rUmbAddress,
    );
  }

  console.warn('MAKE SURE YOU SET MULTISIG AS OWNER')
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
