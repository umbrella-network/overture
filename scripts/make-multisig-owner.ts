import hre from 'hardhat';

import CONFIG from '../config/config';
import {getUmbContract,} from './deployers/UMB';
import {currentTimestamp, getProvider, waitForTx} from './helpers';
import {getRewardsContract} from './deployers/Rewards';
import {getStakingRewardsContract} from './deployers/StakingRewards';
import {getRUmb1Contract} from './deployers/rUMB';

const {ethers} = hre;

async function main() {
  const deployerSigner = (await ethers.getSigners())[<number>hre.config.namedAccounts.deployer];

  if (!deployerSigner) {
    throw Error('deployer PK is not set, check `hardhat.config` and setup .env');
  }

  console.log(`\n\n${'-'.repeat(80)}\nSCRIPT STARTS AT: ${currentTimestamp}\n\n`);
  console.log('ENV:', CONFIG.env);

  if (!CONFIG.multiSig.address) {
    throw Error('MultiSig address not set');
  }

  const provider = getProvider();

  console.log('setting up multiSig for UMB...');
  const umb = await getUmbContract();
  let tx = await umb.transferOwnership(CONFIG.multiSig.address);
  await waitForTx(tx.hash, provider);

  console.log('setting up multiSig for rUMB1...');
  const rUmb = await getRUmb1Contract();
  tx = await rUmb.transferOwnership(CONFIG.multiSig.address);
  await waitForTx(tx.hash, provider);

  console.log('setting up multiSig for Rewards...');
  const rewards = await getRewardsContract();
  tx = await rewards.transferOwnership(CONFIG.multiSig.address);
  await waitForTx(tx.hash, provider);

  console.log('setting up multiSig for StakingRewards/farming...');
  const stakingRewards = await getStakingRewardsContract();
  tx = await stakingRewards.transferOwnership(CONFIG.multiSig.address);
  await waitForTx(tx.hash, provider);

  console.warn('MULTISIG IS NOW OWNER OF ALL CONTRACTS')
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
