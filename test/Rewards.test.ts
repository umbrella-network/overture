import 'hardhat'; // require for IntelliJ to run tests
import '@nomiclabs/hardhat-waffle'; // require for IntelliJ to run tests
import {ethers} from 'hardhat';
import {solidity} from 'ethereum-waffle';
import chai, {expect} from 'chai';
import {BigNumber, Signer} from 'ethers';
import {deployMockContract} from '@ethereum-waffle/mock-contract';
import {Contract} from '@ethersproject/contracts';
import IERC20 from '@openzeppelin/contracts/build/contracts/IERC20.json';
import {getBlockTimestamp, mintBlock} from './utils';

chai.use(solidity);

interface Reward {
  total: BigNumber;
  paid: BigNumber;
  duration: BigNumber;
}

const newReward = (total: number, duration: number, paid: number): Reward => ({
  total: BigNumber.from(total), duration: BigNumber.from(duration), paid: BigNumber.from(paid)
});

const cloneReward = ({total, duration, paid}: Reward): Reward => {
  return {total, duration, paid};
};

describe('Rewards', async () => {
  let rewards: Contract, token: Contract;
  let owner: Signer, ownerAddress: string;
  let linearParticipant: Signer, linearParticipantAddress: string;

  const setup = async () => {
    const [owner, linearParticipant] = await ethers.getSigners();

    const contract = await ethers.getContractFactory('Rewards');
    const rewards = await contract.deploy(owner.address);
    await rewards.deployed();

    const token = await deployMockContract(owner, IERC20.abi);

    return {
      owner,
      ownerAddress: owner.address,
      linearParticipant,
      linearParticipantAddress: linearParticipant.address,
      rewards,
      token
    };
  };

  beforeEach(async () => {
    ({
      owner,
      linearParticipant,
      rewards,
      token,
      ownerAddress,
      linearParticipantAddress,
    } = await setup());
  });

  it('Should create a contract with an assigned owner', async () => {
    // check the owner
    expect(await rewards.owner()).to.equal(ownerAddress, 'Rewards contract belongs to the owner');

    // check initial values
    expect(await rewards.balanceOf(ownerAddress)).to.equal(0, 'The owner should have 0 balance');
    expect(await rewards.distributionStartTime()).to.equal(0, 'distributionStartTime should be 0 initially');

    expect(await rewards.rewardToken())
      .to.equal(ethers.constants.AddressZero, 'rewardToken should be 0x0 address initially');
  });

  it('Can transfer ownership to another address', async () => {
    expect(await rewards.owner()).to.equal(ownerAddress, 'Rewards contract belongs to the owner');
    await rewards.transferOwnership(linearParticipantAddress);

    expect(await rewards.owner())
      .to.equal(linearParticipantAddress, 'Rewards contract should belong to another address');
  });

  describe('.setupDistribution()', () => {
    it('Participant array should be non-empty', async () => {
      await expect(rewards.setupDistribution(token.address, [], [1000], [10]))
        .to.revertedWith('revert there is no _participants');
    });

    it('Length of participants and rewards should match', async () => {
      await expect(rewards.setupDistribution(token.address, [linearParticipantAddress], [], [10]))
        .to.revertedWith('revert _participants count must match _rewards count');
    });

    it('Length of participants and durations should match', async () => {
      await
        expect(rewards.setupDistribution(token.address, [linearParticipantAddress], [1000], []))
          .to.revertedWith('revert _participants count must match _durations count');
    });

    it('participants can NOT be empty addresses', async () => {
      await
        expect(rewards.setupDistribution(token.address, [ethers.constants.AddressZero], [1000], [1]))
          .to.revertedWith('revert empty participant');
    });

    it('token can NOT be empty', async () => {
      await
        expect(rewards.setupDistribution(ethers.constants.AddressZero, [linearParticipantAddress], [1000], [1]))
          .to.revertedWith('revert empty _rewardToken');
    });

    it('Number of allocated tokens cannot not be less than the amount of rewards', async () => {
      await token.mock.balanceOf.withArgs(rewards.address).returns(999);

      expect(rewards.setupDistribution(rewards.address, [linearParticipantAddress], [1000], [1]))
        .to.revertedWith('revert not enough tokens for rewards');
    });

    it('emit LogSetup', async () => {
      await token.mock.balanceOf.withArgs(rewards.address).returns(1000);

      await
        expect(rewards.setupDistribution(token.address, [linearParticipantAddress], [1000], [1]))
          .to.emit(rewards, 'LogSetup').withArgs(1000, token.address);
    });

    describe('when setup done', () => {
      beforeEach(async () => {
        await token.mock.balanceOf.withArgs(rewards.address).returns(1000);
        await rewards.setupDistribution(token.address, [linearParticipantAddress], [1000], [2]);
      });

      it('expect setupDone = true', async () => {
        expect(await rewards.setupDone()).to.be.true;
      });

      it('expect valid rewardToken', async () => {
        expect(await rewards.rewardToken()).to.eq(token.address);
      });

      it('expect valid participant', async () => {
        const linearReward = cloneReward(await rewards.rewards(linearParticipantAddress))
        expect(linearReward).to.eql(newReward(1000, 2, 0));
      });
    });
  });

  describe('.start()', async () => {
    it('can NOT start if linear setup not done', async () => {
      await expect(rewards.start()).to.revertedWith('revert contract not setup');
    });

    it('can NOT start if bulk setup not done', async () => {
      await expect(rewards.start()).to.revertedWith('revert contract not setup');
    });

    describe('when setup', async () => {
      beforeEach(async () => {
        await token.mock.balanceOf.withArgs(rewards.address).returns(1000);
        await rewards.setupDistribution(token.address, [linearParticipantAddress], [1000], [1]);
      });

      it('The owner can start distribution', async () => {
        await token.mock.balanceOf.withArgs(rewards.address).returns(1000);
        await rewards.start();
        const startTime = await getBlockTimestamp();

        expect(await rewards.distributionStartTime()).to.eql(BigNumber.from(startTime));
      });
    });
  });

  describe('.balanceOf()', () => {
    describe('for linear rewards', () => {
      it('balance increases over time', async () => {
        await token.mock.balanceOf.withArgs(rewards.address).returns(1200);

        const duration = 23
        const amount = 61;

        await rewards.setupDistribution(token.address, [linearParticipantAddress], [amount], [duration]);
        await rewards.start();

        const startTime = (await rewards.distributionStartTime()).toNumber();
        let timestamp = await getBlockTimestamp();

        while (timestamp < startTime + duration) {
          timestamp = await getBlockTimestamp();

          const progress = Math.min(Math.max(0, (timestamp - startTime) / duration), 1);

          const expectedBalance = Math.floor(progress * amount);

          expect(await rewards.balanceOf(linearParticipantAddress))
            .to.equal(expectedBalance, `The balance is expected to be ${expectedBalance}`);

          // mines and increases time by 1
          await mintBlock();
        }
      });
    });
  });

  describe('.claim()', () => {
    it('Throws if there is nothing to claim', async () => {
      await token.mock.balanceOf.withArgs(rewards.address).returns(1001);
      await token.mock.transfer.withArgs(linearParticipantAddress, 1000).returns(true);

      await rewards.setupDistribution(token.address, [linearParticipantAddress], [1], [2]);
      await rewards.start();

      expect(await rewards.balanceOf(linearParticipantAddress))
        .to.equal(0, 'There should be no tokens to claim initially');

      await expect(rewards.connect(linearParticipant).claim()).to.revertedWith('revert you have no tokens to claim');
    });

    it('Transfer all rewards when time elapsed', async () => {
      await token.mock.balanceOf.withArgs(rewards.address).returns(1099);
      await token.mock.transfer.withArgs(linearParticipantAddress, 1000).returns(true);

      await rewards.setupDistribution(token.address, [linearParticipantAddress], [1000], [1]);
      await rewards.start();
      await mintBlock();

      expect(await rewards.balanceOf(linearParticipantAddress))
        .to.equal(1000, 'balanceOf returns all tokens at the end');

      expect(cloneReward(await rewards.rewards(linearParticipantAddress)))
        .to.eql(newReward(1000, 1, 0), 'rewards returns all tokens');

      expect(await rewards.connect(linearParticipant).claim())
        .to.emit(rewards, 'LogClaimed').withArgs(linearParticipantAddress, 1000);

      expect(await rewards.balanceOf(linearParticipantAddress)).to.equal(0, 'balance is 0 when all tokens are claimed');

      expect(cloneReward(await rewards.rewards(linearParticipantAddress)))
        .to.eql(
        newReward(1000, 1, 1000),
        'all rewards are claimed; so, tokens paid equal to the total number of tokens'
      );
    });

    it('Claim rewards gradually', async () => {
      await token.mock.balanceOf.withArgs(rewards.address).returns(1000);
      await token.mock.transfer.withArgs(linearParticipantAddress, 2).returns(true);
      await token.mock.transfer.withArgs(linearParticipantAddress, 3).returns(true);

      const duration = 23, amount = 61;
      const startTime = (await getBlockTimestamp()) + 2;

      await rewards.setupDistribution(token.address, [linearParticipantAddress], [amount], [duration])
      await expect(rewards.start()).to.emit(rewards, 'LogStart').withArgs(startTime);

      let timestamp = await getBlockTimestamp();

      let claimed = 0;
      while (timestamp < startTime + duration) {
        timestamp = await getBlockTimestamp();

        const progress = Math.min(Math.max(0, (timestamp - startTime + 1) / duration), 1);
        const toClaim = Math.floor(progress * amount) - claimed;

        if (toClaim > 0) {
          expect(await rewards.connect(linearParticipant).claim())
            .to.emit(rewards, 'LogClaimed').withArgs(linearParticipantAddress, toClaim);

          claimed += toClaim;
          expect(cloneReward(await rewards.rewards(linearParticipantAddress)))
            .to.eql(newReward(amount, duration, claimed), `${claimed} tokens are claimed`);
        } else {
          await mintBlock();
        }
      }

      expect(claimed).to.equal(amount);
    });

    it('Rollback claim() if transfer returns false', async () => {
      await token.mock.balanceOf.withArgs(rewards.address).returns(1001);
      await token.mock.transfer.withArgs(linearParticipantAddress, 100).returns(false);

      await rewards.setupDistribution(token.address, [linearParticipantAddress], [1000], [10]);
      await rewards.start();

      await expect(rewards.connect(linearParticipant).claim())
        .to.revertedWith('revert SafeERC20: ERC20 operation did not succeed');
    });
  });

  it('Cannot send ETH to the contract', async () => {
    await expect(owner.sendTransaction({from: ownerAddress, to: rewards.address, value: '0x20'}))
      .to.revertedWith('Transaction reverted');
  });
});
