import CONFIG from '../config/config';

import hre from 'hardhat';
import {multiSigContract} from "./deployers/UmbMultiSig";
import {deployLibStrings} from "./deployers/LibStrings";
import {checkTxSubmission, getProvider, validationMark, waitForTx, wasTxExecuted} from "./helpers";
import {deployRUMB1} from "./deployers/rUMB";
import {deployRewards} from "./deployers/Rewards";
import {deployStakingRewards} from "./deployers/StakingRewards";

const {ethers, getNamedAccounts} = hre;
const {BigNumber} = ethers

async function main() {
  const {deployer} = await getNamedAccounts();
  const multiSigOwnerWallet = (await ethers.getSigners())[<number>hre.config.namedAccounts.multiSigOwner1];
  const owner = await multiSigOwnerWallet.getAddress()

  console.log('ENV:', CONFIG.env);
  console.log('DEPLOYING FROM ADDRESS:', deployer);

  if (!CONFIG.UMB.address) {
    console.log(validationMark(false))
    console.log('UMB ADDRESS IS EMPTY');
    return
  }

  const provider = getProvider()
  let multiSig


  if (!CONFIG.multiSig.address) {
    console.log(validationMark(false))
    console.log('MULTISIG ADDRESS IS EMPTY');
    return
  } else {
    multiSig = await multiSigContract()
  }

  const libStrings = CONFIG.libs.strings || (await deployLibStrings()).address;
  const rUmb1 = await deployRUMB1(multiSig.address, libStrings)
  const rewards = await deployRewards(multiSig.address)

  console.log(`\nMinting rewards for individual vesting...`)

  const rewardsSum = CONFIG.stage1.rewards.amounts.reduce(
    (acc, amount) => acc.add(BigNumber.from(amount)), BigNumber.from(0)
  );

  let tx;

  if (rewardsSum.gt(0)) {
    console.log('> total reward amount to mint:', rewardsSum.toString(), 'rUMB1')

    let tx = await multiSig
      .connect(multiSigOwnerWallet)
      .submitTokenMintTx(rUmb1.address, rewards.address, rewardsSum.toString())

    let txId = checkTxSubmission(multiSig, await waitForTx(tx.hash, provider));
    await wasTxExecuted(multiSig, txId)

    console.log('Balance of Rewards contract:', (await rUmb1.balanceOf(rewards.address)).toString())
    console.log('starting distribution...')

    if ((await rUmb1.balanceOf(rewards.address)).toString() === rewardsSum.toString()) {
      const {startTime, participants, amounts, durations} = CONFIG.stage1.rewards

      let tx = await multiSig
        .connect(multiSigOwnerWallet)
        .submitRewardsStartDistributionTx(
          rewards.address, rUmb1.address, startTime, participants, amounts, durations
        )

      let txId = checkTxSubmission(multiSig, await waitForTx(tx.hash, provider));

      if (await wasTxExecuted(multiSig, txId)) {
        console.log('Distribution started at', (await rewards.distributionStartTime()).toString())
        console.log('Key burned for Rewards contract?', validationMark(await rewards.owner() === ethers.constants.AddressZero))
        console.log('participantsCount valid?', validationMark((await rewards.participantsCount()).toString() === participants.length.toString(10)))
      } else {
        console.log('start of Distribution needs to be confirm using multiwallet, TX ID:', txId)
      }
    } else {
      console.log('!! Balance for Rewards contract is not enough to start distribution.')
      console.log('!! you need to confirm tx with MultiSig')
    }
  } else {
    console.log('there is no rewards set, skipping deployment of Rewards contract')
  }

  console.log(`\nMinting rewards for DeFi farming...`)

  const stakingRewards = await deployStakingRewards(multiSig.address, rUmb1.address)

  tx = await multiSig
    .connect(multiSigOwnerWallet)
    .submitTokenMintTx(rUmb1.address, stakingRewards.address, CONFIG.stage1.farming.tokenAmountForDeFiRewards)

  let txId = checkTxSubmission(multiSig, await waitForTx(tx.hash, provider));

  await wasTxExecuted(multiSig, txId)
  console.log('Notify StakingRewards about reward amount, MultiSig tx ID:', txId)

  tx = await multiSig
    .connect(multiSigOwnerWallet)
    .submitStakingRewardsNotifyRewardAmountTx(stakingRewards.address, CONFIG.stage1.farming.tokenAmountForDeFiRewards)

  txId = checkTxSubmission(multiSig, await waitForTx(tx.hash, provider));

  if (await wasTxExecuted(multiSig, txId)) {
    console.log(validationMark(true))
    console.log('Balance of StakingRewards contract:', (await rUmb1.balanceOf(stakingRewards.address)).toString())
  } else {
    console.log('!! MUST Notify StakingRewards about reward amount via MultiSig, tx ID:', txId)
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });