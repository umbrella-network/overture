import CONFIG from '../config/config';
import {breakLog, getProvider, waitForTx} from './helpers';
import {getStakingRewardsContract} from './deployers/StakingRewards';
import {getRUmb1Contract} from './deployers/rUMB';

const main = async () => {
  const provider = getProvider();
  breakLog();
  console.log('Minting rewards for DeFi farming...');

  const rUmb = await getRUmb1Contract();
  const stakingRewards = await getStakingRewardsContract();

  let tx = await rUmb.mint(stakingRewards.address, CONFIG.stage1.farming.tokenAmountForDeFiRewards);
  await waitForTx(tx.hash, provider);

  tx = await stakingRewards.notifyRewardAmount(CONFIG.stage1.farming.tokenAmountForDeFiRewards);
  await waitForTx(tx.hash, provider);

  breakLog();
  console.log('OMG FARMING IS LIVE!!!')
}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
