import 'hardhat'; // require for IntelliJ to run tests
import '@nomiclabs/hardhat-waffle'; // require for IntelliJ to run tests

import {ethers} from 'hardhat';
import {expect} from 'chai';
import {BigNumber, ContractFactory, Signer} from 'ethers';
import {deployMockContract} from '@ethereum-waffle/mock-contract';
import {Contract} from '@ethersproject/contracts';

import {getArtifacts, getProvider} from '../scripts/helpers';
import {getBlockTimestamp, mintBlock, numberToWei} from './utils';

const [UMB, rUMB1, StakingRewards] = getArtifacts('UMB', 'rUMB1', 'StakingRewards');

describe('StakingRewards', () => {
  let rewardsDistributor: Signer;
  let staker1: Signer;
  let staker2: Signer;
  let staker1Address: string;
  let staker2Address: string;
  let umb: Contract;
  let rUmb: Contract;
  let contract: Contract;

  const setup = async () => {
    const [owner, rewardsDistributor, staker1, staker2] = await ethers.getSigners();
    const provider = getProvider();
    const umb = await deployMockContract(owner, UMB.abi);
    const rUmb = await deployMockContract(owner, rUMB1.abi);

    const contractFactory = new ContractFactory(StakingRewards.abi, StakingRewards.bytecode, owner);
    const ownerAddress = await owner.getAddress();
    const rewardsDistributorAddress = await rewardsDistributor.getAddress();

    const contract = await contractFactory.deploy(
      ownerAddress,
      rewardsDistributorAddress,
      umb.address,
      rUmb.address
    );

    return {owner, rewardsDistributor, staker1, staker2, umb, rUmb, contract, provider};
  };

  const mockRUmbBalanceOf = async (account: string, balance = '0') => {
    await rUmb.mock.balanceOf.withArgs(account).returns(balance);
  };

  const mockTransferFrom = async (
    token: Contract,
    from?: Signer,
    to?: string,
    amount?: string | number | BigNumber,
    returns = true
  ): Promise<void> => {
    return from && to !== undefined && amount !== undefined
      ? token.mock.transferFrom.withArgs(await from.getAddress(), to, amount).returns(returns)
      : token.mock.transferFrom.returns(returns);
  };

  const mockTransfer = async (
    token: Contract,
    to: Signer,
    amount: string | number | BigNumber,
    returns = true
  ): Promise<void> => token.mock.transfer.withArgs(await to.getAddress(), amount).returns(returns)


  beforeEach(async () => {
    ({rewardsDistributor, umb, rUmb, contract, staker1, staker2} = await setup());
    staker1Address = await staker1.getAddress();
    staker2Address = await staker2.getAddress();
  });

  describe('when deployed', () => {
    it('expect totalSupply = 0', async () => {
      expect(await contract.totalSupply()).to.equal(0);
    });

    it('expect lastTimeRewardApplicable = 0', async () => {
      expect(await contract.lastTimeRewardApplicable()).to.equal(0);
    });

    it('expect rewardRate = 0', async () => {
      expect(await contract.rewardRate()).to.equal(0);
    });

    it('expect rewardsDuration to be 1 year', async () => {
      expect(await contract.rewardsDuration()).to.equal(365 * 24 * 60 * 60);
    });

    it('expect periodFinish = 0', async () => {
      expect(await contract.periodFinish()).to.eq(0);
    });

    it('expect getRewardForDuration = 0', async () => {
      expect(await contract.getRewardForDuration()).to.eq(0);
    });

    it('expect throw on stake', async () => {
      await expect(contract.stake(1)).to.revertedWith('revert Stake period not started yet');
    });

    it('expect throw on finishFarming', async () => {
      await expect(contract.finishFarming()).to.revertedWith('revert can\'t stop if not started or already finished');
    });
  });

  describe('.setRewardsDuration()', () => {
    it('expect throw when sent NOT from owner', async () => {
      await expect(contract.connect(rewardsDistributor).setRewardsDuration(10))
        .to.revertedWith('revert Ownable: caller is not the owner');
    });

    it('expect throw for empty duration', async () => {
      await expect(contract.setRewardsDuration(0))
        .to.revertedWith('revert empty _rewardsDuration');
    });

    it('expect to emit event', async () => {
      await expect(contract.setRewardsDuration(200))
        .to.emit(contract, 'RewardsDurationUpdated').withArgs(200);
    });

    describe('when rewardsDuration is set', () => {
      beforeEach(async () => {
        await contract.setRewardsDuration(11111);
      });

      it('expect to have rewardsDuration', async () => {
        expect(await contract.rewardsDuration()).to.eq(11111);
      });

      it('allow to set again if farming not started yet', async () => {
        await expect(contract.setRewardsDuration(99))
          .to.emit(contract, 'RewardsDurationUpdated').withArgs(99);
      });

      describe('when contract notified about reward', () => {
        beforeEach(async () => {
          const reward = numberToWei(1);
          await mockRUmbBalanceOf(contract.address, reward);
          await contract.connect(rewardsDistributor).notifyRewardAmount(reward);
        });

        it('expect to throw when try to set duration', async () => {
          await expect(contract.setRewardsDuration(10))
            .to.revertedWith(
              'Previous rewards period must be complete before changing the duration for the new period'
            );
        });
      });
    });
  });

  describe('.notifyRewardAmount()', () => {
    describe('rewardRates should be different for different rewards', () => {
      [
        {reward: numberToWei(1), rewardRate: 31709791983},
        {reward: numberToWei(10), rewardRate: 317097919837},
        {reward: numberToWei(365 * 24 * 60 * 60), rewardRate: '1000000000000000000'},
      ].forEach((testCase, i) => {
        it(`expect valid rewardRate for reward ${testCase.reward} #${i}`, async () => {
          await mockRUmbBalanceOf(contract.address, testCase.reward);
          await contract.connect(rewardsDistributor).notifyRewardAmount(testCase.reward);
          expect(await contract.rewardRate()).to.equal(testCase.rewardRate);
        });
      });
    });

    it('expect throw when sent NOT from rewardsDistributor', async () => {
      await expect(contract.notifyRewardAmount(2)).to.revertedWith('revert Caller is not RewardsDistribution contract');
    });

    it('expect throw when reward to high', async () => {
      await mockRUmbBalanceOf(contract.address, numberToWei(1));
      await expect(contract.connect(rewardsDistributor).notifyRewardAmount(numberToWei(1.01)))
        .to.revertedWith('Provided reward too high');
    });

    it('expect to emit RewardAdded', async () => {
      const amount = numberToWei(1);
      await mockRUmbBalanceOf(contract.address, amount);
      await expect(contract.connect(rewardsDistributor).notifyRewardAmount(amount))
        .to.emit(contract, 'RewardAdded').withArgs(amount);
    });

    describe('when notified about reward amount', () => {
      const reward = numberToWei(365 * 24 * 60 * 60);

      beforeEach(async () => {
        await mockRUmbBalanceOf(contract.address, reward);
        await contract.connect(rewardsDistributor).notifyRewardAmount(reward);
      });

      it('expect to calculate total RewardForDuration', async () => {
        expect(await contract.getRewardForDuration()).to.eq(reward);
      });

      it('allows to notify again', async () => {
        const prevLastUpdateTime = await contract.lastUpdateTime();
        const prevPeriodFinish = await contract.periodFinish();
        await mockRUmbBalanceOf(contract.address, reward);
        await expect(contract.connect(rewardsDistributor).notifyRewardAmount(numberToWei(2))).to.not.be.reverted;
        expect(await contract.lastUpdateTime()).to.be.gt(prevLastUpdateTime);
        expect(await contract.periodFinish()).to.be.gt(prevPeriodFinish);
      });

      it('expect throw when notified again, but reward too high', async () => {
        const newReward = BigNumber.from(reward).add(1);
        await mockRUmbBalanceOf(contract.address, reward);
        await expect(contract.connect(rewardsDistributor).notifyRewardAmount(newReward))
          .to.revertedWith('Provided reward too high');
      });

      it('expect to emit event when notified again', async () => {
        const newReward = numberToWei('0.000000007');
        await mockRUmbBalanceOf(contract.address, BigNumber.from(reward).add(newReward).toString());
        await expect(contract.connect(rewardsDistributor).notifyRewardAmount(newReward))
          .to.emit(contract, 'RewardAdded').withArgs(7000000000);
      });

      it('expect to have rewardRate', async () => {
        expect(await contract.rewardRate()).to.equal(numberToWei(1));
      });

      it('expect to have lastUpdateTime', async () => {
        expect(await contract.lastUpdateTime()).to.gt(0);
      });

      it('expect to have periodFinish', async () => {
        expect(await contract.periodFinish()).to.gt(0);
      });
    });
  });

  describe('.stake()', () => {
    it('expect throw when farming not started', async () => {
      await expect(contract.stake(1)).to.be.revertedWith('Stake period not started yet');
    });

    describe('when staking started', () => {
      const reward = numberToWei(10);
      const rewardsDuration = 20;

      beforeEach(async () => {
        await contract.setRewardsDuration(rewardsDuration);
        await mockRUmbBalanceOf(contract.address, reward);
        await contract.connect(rewardsDistributor).notifyRewardAmount(reward);
      });

      it('expect throw when empty amount', async () => {
        await expect(contract.stake(0)).to.be.revertedWith('Cannot stake 0');
      });

      it('expect throw when staker dont have coins', async () => {
        await mockTransferFrom(umb, staker1, contract.address, 0, false);
        await expect(contract.connect(staker1).stake(1)).to.be.revertedWith('VM Exception');
      });

      it('expect to emit event on stake', async () => {
        await mockTransferFrom(umb, staker1, contract.address, 1, true);
        await expect(contract.connect(staker1).stake(1))
          .to.emit(contract, 'Staked').withArgs(staker1Address, 1);
      });

      describe('when staked', () => {
        const stakedAmount = numberToWei(9);

        beforeEach(async () => {
          await mockTransferFrom(umb, staker1, contract.address, stakedAmount, true);
          await contract.connect(staker1).stake(stakedAmount);
        });

        it('expect to have balance', async () => {
          expect(await contract.balanceOf(staker1Address)).to.eq(stakedAmount);
        });

        it('expect totalSupply to = staked balance', async () => {
          expect(await contract.totalSupply()).to.eq(stakedAmount);
        });

        it('allows to exit after stake', async () => {
          await mockTransfer(umb, staker1, stakedAmount);
          await mockTransfer(rUmb, staker1, '1499999999999999994');
          await contract.connect(staker1).exit();
          expect(await contract.totalSupply()).to.eq(0);
        });
      });
    });
  });

  describe('.withdraw()', () => {
    it('expect throw when withdraw amount empty', async () => {
      await expect(contract.withdraw(0)).to.be.revertedWith('Cannot withdraw 0');
    });

    describe('when staked', () => {
      const reward = numberToWei(10);
      const rewardsDuration = 20;
      const stakedAmount = numberToWei(9);
      const halfStakedAmount = numberToWei(4.5);
      let earned: BigNumber;

      beforeEach(async () => {
        await contract.setRewardsDuration(rewardsDuration);
        await mockRUmbBalanceOf(contract.address, reward);
        await contract.connect(rewardsDistributor).notifyRewardAmount(reward);
        await mockTransferFrom(umb, staker1, contract.address, stakedAmount, true);
        await contract.connect(staker1).stake(stakedAmount);
      });

      it('expect withdraw to emit event', async () => {
        await mockTransfer(umb, staker1, halfStakedAmount);
        await expect(contract.connect(staker1).withdraw(halfStakedAmount))
          .to.emit(contract, 'Withdrawn').withArgs(staker1Address, halfStakedAmount);

        expect(await contract.balanceOf(staker1Address)).to.eq(halfStakedAmount);
      });

      it('expect throw when token transfer fail', async () => {
        await mockTransfer(umb, staker1, halfStakedAmount, false);
        await expect(contract.connect(staker1).withdraw(1)).to.be.revertedWith('VM Exception');
      });

      it('expect throw when withdrowing more than balance', async () => {
        const tooMuch = BigNumber.from(stakedAmount).add(1);
        await expect(contract.connect(staker1).withdraw(tooMuch)).to.be.revertedWith('VM Exception');
      });

      describe('when withdrawed half', () => {
        beforeEach(async () => {
          earned = await contract.earned(staker1Address);
          await mockTransfer(umb, staker1, halfStakedAmount);
          await contract.connect(staker1).withdraw(halfStakedAmount);
        });

        it('expect to have balance', async () => {
          expect(await contract.balanceOf(staker1Address)).to.eq(halfStakedAmount);
        });

        it('expect to have earnings', async () => {
          expect(await contract.earned(staker1Address)).to.gte(earned);
        });

        it('expect to have pending rewards', async () => {
          expect(await contract.rewards(staker1Address)).to.gte(earned);
        });

        it('allows to exit when something left for withdraw', async () => {
          await mockTransfer(umb, staker1, halfStakedAmount);
          await mockTransfer(rUmb, staker1, '2499999999999999997');
          await contract.connect(staker1).exit();
          expect(await contract.totalSupply()).to.eq(0);
        });
      });
    });
  });

  describe('.getReward()', () => {
    describe('when staking started', () => {
      const reward = numberToWei(10);
      const rewardsDuration = 10;

      beforeEach(async () => {
        await contract.setRewardsDuration(rewardsDuration);
        await mockRUmbBalanceOf(contract.address, reward);
        await contract.connect(rewardsDistributor).notifyRewardAmount(reward);
      });

      describe('when staked', () => {
        const stakedAmount = numberToWei(9);
        const rewardForStake = '1999999999999999998';

        beforeEach(async () => {
          await mockTransferFrom(umb, staker1, contract.address, stakedAmount, true);
          await contract.connect(staker1).stake(stakedAmount);
        });

        it('expect getReward to emit event', async () => {
          await mockTransfer(rUmb, staker1, rewardForStake);
          await expect(contract.connect(staker1).getReward())
            .to.emit(contract, 'RewardPaid').withArgs(staker1Address, rewardForStake);
        });

        it('expect to throw if token.transfer fail', async () => {
          await mockTransfer(rUmb, staker1, rewardForStake, false);
          await expect(contract.connect(staker1).getReward()).to.revertedWith('VM Exception');
        });

        describe('when got reward', () => {
          beforeEach(async () => {
            await mockTransfer(rUmb, staker1, rewardForStake);
            await expect(contract.connect(staker1).getReward())
              .to.emit(contract, 'RewardPaid').withArgs(staker1Address, rewardForStake);
          });

          it('expect pending rewards to be empty', async () => {
            expect(await contract.rewards(staker1Address)).to.eq(0);
          });

          it('expect to have balance', async () => {
            expect(await contract.balanceOf(staker1Address)).to.eq(stakedAmount);
          });

          it('allows to exit after reward is claimed', async () => {
            await mockTransfer(umb, staker1, stakedAmount);
            await mockTransfer(rUmb, staker1, '2999999999999999997');
            await contract.connect(staker1).exit();
            expect(await contract.totalSupply()).to.eq(0);
          });
        });
      });
    });
  });

  describe('.finishFarming()', () => {
    it('expect to throw when executed by NOT an owner', async () => {
      await expect(contract.connect(staker1).finishFarming())
        .to.revertedWith('revert Ownable: caller is not the owner');
    });

    it('expect throw when farming not started', async () => {
      await expect(contract.finishFarming()).to.be.revertedWith('can\'t stop if not started or already finished');
      expect(await contract.stopped()).to.be.false;
    });

    describe('when notified about reward', () => {
      const contractBalance = numberToWei(22);
      const reward = numberToWei(10);
      let startBlockTimestamp: number;
      const rewardsDuration = 20;

      beforeEach(async () => {
        await contract.setRewardsDuration(rewardsDuration);
        await mockRUmbBalanceOf(contract.address, contractBalance);
        await contract.connect(rewardsDistributor).notifyRewardAmount(reward);
        startBlockTimestamp = await getBlockTimestamp();
      });

      it('allows to stop immediately and burn all tokens', async () => {
        await rUmb.mock.burn.withArgs(contractBalance).returns();
        await contract.finishFarming();
        expect(await contract.stopped()).to.be.true;
      });

      it('throw when call finishFarming multiple times', async () => {
        await rUmb.mock.burn.withArgs(contractBalance).returns();
        await contract.finishFarming();
        await expect(contract.finishFarming()).to.revertedWith('revert farming is stopped');
      });

      describe('with staked tokens', () => {
        const stakedAmount = numberToWei(0.5);

        beforeEach(async () => {
          await mockTransferFrom(umb);
          await contract.connect(staker1).stake(stakedAmount);
        });

        it('expect to calculate RewardForDuration', async () => {
          expect(await contract.getRewardForDuration()).to.eq(reward);
        });

        it('allows to stop and burn tokens that left', async () => {
          // when tx is minted, time is increased by 1
          // we need to compensate for N future transactions:
          // - mock.burn()
          // - contract.finishFarming()
          const futureTime = 2;
          const rewardsPastTime = (await getBlockTimestamp()) - startBlockTimestamp + futureTime;
          const tokensForRewards = BigNumber.from(reward).mul(rewardsPastTime).div(rewardsDuration);
          const tokensToBurn = BigNumber.from(reward).sub(tokensForRewards);

          await rUmb.mock.burn.withArgs(tokensToBurn).returns();
          await expect(contract.finishFarming()).to.emit(contract, 'FarmingFinished')

          expect(await contract.stopped()).to.be.true;

          expect(await contract.getRewardForDuration())
            .to.eq(tokensForRewards, 'remaining tokens should be burned');
        });

        describe('with yet another staker', () => {
          const stakedAmount2 = numberToWei(0.01);

          beforeEach(async () => {
            await mockTransferFrom(umb);
            await contract.connect(staker2).stake(stakedAmount2);
          });

          describe('when we at 50% of duration time', () => {
            let staker1Earnings: BigNumber;
            let staker2Earnings: BigNumber;

            beforeEach(async () => {
              await mintBlock();
              await mintBlock();
              await mintBlock();
              await mintBlock();
              const futureBlocks = 2; // burn + stop

              expect(await getBlockTimestamp())
                .to.eq(startBlockTimestamp + rewardsDuration / 2 - futureBlocks, 'we are not in a middle of duration');

              staker1Earnings = await contract.earned(staker1Address);
              staker2Earnings = await contract.earned(staker2Address);
            });

            describe('when stopped', () => {
              let staker1FinalEarnings: BigNumber;
              let staker2FinalEarnings: BigNumber;

              beforeEach(async () => {
                await rUmb.mock.burn.withArgs(BigNumber.from(reward).div(2)).returns();
                await contract.finishFarming();

                expect(await getBlockTimestamp()).to.eq(startBlockTimestamp + rewardsDuration / 2);

                staker1FinalEarnings = await contract.earned(staker1Address);
                staker2FinalEarnings = await contract.earned(staker2Address);
              });

              it('expect staker1 do not lost earnings', async () => {
                expect(staker1FinalEarnings).to.gte(staker1Earnings);
              });

              it('expect staker2 do not lost earnings', async () => {
                expect(staker2FinalEarnings).to.gte(staker2Earnings);
              });

              it('expect left tokens to be enough for total earnings', async () => {
                expect(staker1FinalEarnings.add(staker2FinalEarnings)).to.lte(BigNumber.from(reward).div(2));
              });

              it('allows to exit for all stakers', async () => {
                await mockTransfer(umb, staker1, stakedAmount);
                await mockTransfer(rUmb, staker1, '3941176470588235294');
                await contract.connect(staker1).exit();

                await mockTransfer(umb, staker2, stakedAmount2);
                await mockTransfer(rUmb, staker2, '58823529411764705');
                await contract.connect(staker2).exit();

                expect(await contract.totalSupply()).to.eq(0);
              });
            });
          });
        });
      });
    });
  });
});
