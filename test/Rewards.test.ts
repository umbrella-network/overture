import {ethers} from 'hardhat';
import {solidity} from 'ethereum-waffle';
import chai, {expect} from 'chai';
import {BigNumber, Signer} from 'ethers';
import {deployMockContract} from '@ethereum-waffle/mock-contract';
import {Contract} from '@ethersproject/contracts';
import IERC20 from '@openzeppelin/contracts/build/contracts/IERC20.json';

chai.use(solidity);

describe('Rewards', async () => {
  let rewards: Contract, token: Contract;
  let owner: Signer, ownerAddress: string;
  let participant: Signer, participantAddress: string;

  beforeEach(async () => {
    ({owner, participant, rewards, token, ownerAddress, participantAddress} = await setup());
  });

  const setup = async () => {
    const [owner, participant] = await ethers.getSigners();

    const contract = await ethers.getContractFactory('Rewards');
    const rewards = await contract.deploy(owner.address);
    await rewards.deployed();

    const token = await deployMockContract(owner, IERC20.abi);

    return {owner, ownerAddress: owner.address, participant, participantAddress: participant.address, rewards, token};
  };

  it('Should create a contract with an assigned owner', async () => {
    // check the owner
    expect(await rewards.owner()).to.equal(ownerAddress, 'Rewards contract belongs to the owner');

    // check initial values
    expect(await rewards.participantsCount()).to.equal(0, 'A new contract should have no participants');
    expect(await rewards.balanceOf(ownerAddress)).to.equal(0, 'The owner should have 0 balance');
    expect(cloneReward(await rewards.rewards(ethers.constants.AddressZero))).to.eql(newReward(0, 0, 0), 'A new contract should have no rewards');
    expect(await rewards.distributionStartTime()).to.equal(0, 'distributionStartTime should be 0 initially');
    expect(await rewards.rewardToken()).to.equal(ethers.constants.AddressZero, 'rewardToken should be 0x0 address initially');
  });

  it('Can transfer ownership to another address', async () => {
    expect(await rewards.owner()).to.equal(ownerAddress, 'Rewards contract belongs to the owner');
    await rewards.transferOwnership(participantAddress);
    expect(await rewards.owner()).to.equal(participantAddress, 'Rewards contract should belong to another address');
  });

  describe('.startDistribution()', () => {
    it('Participant array should be non-empty', async () => {
      await expect(rewards.startDistribution(ethers.constants.AddressZero, 1, [], [1000], [10])).to.revertedWith('VM Exception');
    });

    it('Length of participants and rewards should match', async () => {
      await expect(rewards.startDistribution(ethers.constants.AddressZero, 1, [participantAddress], [], [10])).to.revertedWith('VM Exception');
    });

    it('Length of participants and durations should match', async () => {
      await expect(rewards.startDistribution(ethers.constants.AddressZero, 1, [participantAddress], [1000], [])).to.revertedWith('VM Exception');
    });

    it('Number of allocated tokens cannot not be less than the amount of rewards', async () => {
      await token.mock.balanceOf.withArgs(rewards.address).returns(999);

      await expect(rewards.startDistribution(token.address, 1, [participantAddress], [1000], [10])).to.revertedWith('VM Exception');
    });

    it('The owner can start distribution', async () => {
      await token.mock.balanceOf.withArgs(rewards.address).returns(1001);

      expect(await rewards.startDistribution(token.address, 1, [participantAddress], [1000], [10])).to.emit(rewards, 'LogBurnKey');

      // should lock ownership
      expect(await rewards.owner()).to.equal(ethers.constants.AddressZero, 'The owner resigns from the contract after startDistribution');

      expect(await rewards.participantsCount()).to.equal(1, 'The number of participants should be 1');
    });
  });

  describe('.balanceOf()', () => {
    it('Reward balance increases over time', async () => {
      await token.mock.balanceOf.withArgs(rewards.address).returns(1000);

      const {timestamp: prevTimestamp} = await ethers.provider.getBlock('latest');

      const startTime = prevTimestamp + 5, duration = 23, amount = 61;

      expect(await rewards.startDistribution(token.address, startTime, [participantAddress], [amount], [duration])).to.emit(rewards, 'LogBurnKey');

      for (let i = 0; i <= duration + (startTime - prevTimestamp); ++i) {
        const {timestamp} = await ethers.provider.getBlock('latest');

        const progress = Math.min(Math.max(0,  (timestamp - startTime) / duration), 1);

        const expectedBalance = Math.floor(progress * amount);

        expect(await rewards.balanceOf(participantAddress)).to.equal(expectedBalance, `The balance is expected to be ${expectedBalance}`);

        // mines and increases time by 1
        await ethers.provider.send('evm_mine', []);
      }
    });
  });

  describe('.claim()', async () => {
    it('Throws if there is nothing to claim', async () => {
      await token.mock.balanceOf.withArgs(rewards.address).returns(1001);
      await token.mock.transfer.withArgs(participantAddress, 1000).returns(true);

      const {timestamp} = await ethers.provider.getBlock('latest');

      await rewards.startDistribution(token.address, timestamp + 1, [participantAddress], [1000], [10]);

      expect(await rewards.balanceOf(participantAddress)).to.equal(0, 'There should be no tokens to claim initially');

      await expect(rewards.connect(participant).claim()).to.revertedWith('VM Exception');
    });

    it('Transfer all rewards when time elapsed', async () => {
      await token.mock.balanceOf.withArgs(rewards.address).returns(1001);
      await token.mock.transfer.withArgs(participantAddress, 1000).returns(true);

      await rewards.startDistribution(token.address, 1, [participantAddress], [1000], [10]);

      expect(await rewards.balanceOf(participantAddress)).to.equal(1000, 'balanceOf returns all tokens');
      expect(cloneReward(await rewards.rewards(participantAddress))).to.eql(newReward(1000, 10, 0), 'rewards returns all tokens');

      expect(await rewards.connect(participant).claim()).to.emit(rewards, 'LogClaimed').withArgs(participantAddress, 1000);

      expect(await rewards.balanceOf(participantAddress)).to.equal(0, 'balance is 0 when all tokens are claimed');
      expect(cloneReward(await rewards.rewards(participantAddress))).to.eql(newReward(1000, 10, 1000), 'all rewards are claimed; so, tokens paid equal to the total number of tokens');
    });

    it('Claim rewards gradually', async () => {
      await token.mock.balanceOf.withArgs(rewards.address).returns(1000);
      await token.mock.transfer.withArgs(participantAddress, 2).returns(true);
      await token.mock.transfer.withArgs(participantAddress, 3).returns(true);

      const {timestamp: prevTimestamp} = await ethers.provider.getBlock('latest');

      const startTime = prevTimestamp + 5, duration = 23, amount = 61;

      expect(await rewards.startDistribution(token.address, startTime, [participantAddress], [amount], [duration])).to.emit(rewards, 'LogBurnKey');

      let claimed = 0;
      for (let i = 0; i <= duration + (startTime - prevTimestamp); ++i) {
        const {timestamp} = await ethers.provider.getBlock('latest');

        const progress = Math.min(Math.max(0,  (timestamp - startTime + 1) / duration), 1);
        const toClaim = Math.floor(progress * amount) - claimed;

        if (toClaim > 0) {
          expect(await rewards.connect(participant).claim()).to.emit(rewards, 'LogClaimed').withArgs(participantAddress, toClaim);

          claimed += toClaim;
          expect(cloneReward(await rewards.rewards(participantAddress))).to.eql(newReward(amount, duration, claimed), `${claimed} tokens are claimed`);
        } else {
          await ethers.provider.send('evm_mine', []);
        }
      }

      expect(claimed).to.equal(amount);
    });

    it('Rollback claim() if transfer returns false', async () => {
      await token.mock.balanceOf.withArgs(rewards.address).returns(1001);
      await token.mock.transfer.withArgs(participantAddress, 1000).returns(false);

      await rewards.startDistribution(token.address, 1, [participantAddress], [1000], [10]);

      await expect(rewards.connect(participant).claim()).to.revertedWith('VM Exception');
    });
  });

  it('Cannot send ETH to the contract', async () => {
    await expect(owner.sendTransaction({from: ownerAddress, to: rewards.address, value: '0x20'})).to.revertedWith('Transaction reverted');
  });
});

interface Reward {
  total: BigNumber;
  duration: BigNumber;
  paid: BigNumber;
}

const newReward = (total: number, duration: number, paid: number): Reward => {
  return {total: BigNumber.from(total), duration: BigNumber.from(duration), paid: BigNumber.from(paid)};
};

const cloneReward = ({total, duration, paid}: Reward): Reward => {
  return {total, duration, paid};
};
