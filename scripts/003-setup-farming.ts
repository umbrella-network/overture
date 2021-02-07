import CONFIG from '../config/config';
import {breakLog, getProvider, waitForTx} from './helpers';
import {getStakingRewardsContract} from './deployers/StakingRewards';
import {getRUmb1Contract} from './deployers/rUMB1';
import {getUmbContract} from './deployers/UMB';

const main = async () => {
  const provider = getProvider();
  breakLog();
  console.log('Minting rewards for DeFi farming...', CONFIG.stage1.farming.tokenAmountForDeFiRewards, 'of rUMB1');

  const rUmb1 = await getRUmb1Contract();
  const stakingRewards = await getStakingRewardsContract();

  if ((await rUmb1.balanceOf(stakingRewards.address)).gt(0)) {
    throw Error('!! stakingRewards contract already has balance.');
  }

  let tx = await rUmb1.mint(stakingRewards.address, CONFIG.stage1.farming.tokenAmountForDeFiRewards);
  await waitForTx(tx.hash, provider);

  breakLog();
  console.log('Set rUMB1 as reward token for UMB');
  const umb = await getUmbContract();
  tx = await umb.setRewardTokens([rUmb1.address], [true]);
  await waitForTx(tx.hash, provider);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
