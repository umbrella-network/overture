import hre from 'hardhat';

import CONFIG from '../config/config';
import {getProvider, validationMark, waitForTx} from './helpers';
import {getRewardsContract} from './deployers/Rewards';
import {getUmbContract} from './deployers/UMB';

const {ethers, getNamedAccounts} = hre;
const {BigNumber} = ethers;

const breakLog = (): void => console.log(`\n${'-'.repeat(30)}\n\n`);

const main = async () => {
  const umbRewardsSum = CONFIG.stage1.Rewards.data.reduce(
    (acc, data) => acc.add(BigNumber.from(data.amount)), BigNumber.from(0)
  );

  if (umbRewardsSum.eq(0)) {
    throw Error('there is no rewards set, skipping deployment of Rewards contract');
  }

  const provider = getProvider();
  const umb = await getUmbContract();
  const rewards = await getRewardsContract();
  let tx;

  breakLog();
  console.log('Minting rewards for individual vesting...');
  console.log('>>> total amount to mint:', umbRewardsSum.toString(), 'UMB');

  tx = await umb.mint(rewards.address, umbRewardsSum.toString());
  await waitForTx(tx.hash, provider);

  breakLog();
  console.log('starting distribution...');

  if ((await umb.balanceOf(rewards.address)).lt(umbRewardsSum)) {
    throw Error('!! Balance for Rewards contract is not enough to start distribution.');
  }

  const {startTime, data} = CONFIG.stage1.Rewards;

  const participants: string[] = data.map(item => item.participant);
  const amounts: string[] = data.map(item => item.amount);
  const durations: number[] = data.map(item => item.duration);
  const bulks: number[] = data.map(item => item.bulk || 0);

  console.log('participants', participants);
  console.log('amounts', amounts);
  console.log('durations', durations);
  console.log('bulks', bulks);
  breakLog();

  tx = await rewards.startDistribution(umb.address, startTime, participants, amounts, durations, bulks);
  await waitForTx(tx.hash, provider);
}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
