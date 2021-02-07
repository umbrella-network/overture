import 'hardhat'; // require for IntelliJ to run tests
import '@nomiclabs/hardhat-waffle'; // require for IntelliJ to run tests
import {ethers} from 'hardhat';
import {expect} from 'chai';
import {BigNumber, ContractFactory, Signer} from 'ethers';
import {deployMockContract} from '@ethereum-waffle/mock-contract';
import {Contract} from '@ethersproject/contracts';

import { getArtifacts, getProvider, timestamp} from '../scripts/helpers';
import {ethBalanceOf} from './utils';

const [UmbMultiSig, UMB, rUMB, StakingRewards] =
  getArtifacts('UmbMultiSig', 'UMB', 'rUMB', 'StakingRewards');

describe('UmbMultiSig', () => {
  const requiredPower = 4;
  const powers = [5, 3, 1];

  let deployer: Signer;
  let superOwner: Signer;
  let owner1: Signer;
  let owner2: Signer;
  let owner3: Signer;
  let anyWallet: Signer;

  let deployerAddress: string;
  let superOwnerAddress: string;
  let owner1Address: string;
  let owner2Address: string;
  let owner3Address: string;
  let anyWalletAddress: string;

  let umb: Contract;
  let rUmb: Contract;
  let stakingRewards: Contract;
  let contract: Contract;

  const setup = async () => {
    const [deployer, owner1, owner2, owner3, superOwner, anyWallet] = await ethers.getSigners();
    const provider = getProvider();
    const umb = await deployMockContract(deployer, UMB.abi);
    const rUmb = await deployMockContract(deployer, rUMB.abi);
    const stakingRewards = await deployMockContract(deployer, StakingRewards.abi);

    const contractFactory = new ContractFactory(UmbMultiSig.abi, UmbMultiSig.bytecode, deployer);

    const contract = await contractFactory.deploy(
      [await superOwner.getAddress(), await owner1.getAddress(), await owner2.getAddress()],
      powers,
      requiredPower
    );

    return {
      deployer,
      owner1,
      owner2,
      owner3,
      superOwner,
      anyWallet,
      umb,
      rUmb,
      stakingRewards,
      contract,
      provider
    };
  };

  beforeEach(async () => {
    ({
      deployer,
      owner1,
      owner2,
      owner3,
      superOwner,
      anyWallet,
      umb,
      rUmb,
      stakingRewards,
      contract
    } = await setup());
    deployerAddress = await deployer.getAddress();
    superOwnerAddress = await superOwner.getAddress();
    owner1Address = await owner1.getAddress();
    owner2Address = await owner2.getAddress();
    owner3Address = await owner3.getAddress();
    anyWalletAddress = await anyWallet.getAddress();
  });

  describe('when deployed', () => {
    it('expect requiredPower = 4', async () => {
      expect(await contract.requiredPower()).to.equal(4);
    });

    it('expect totalCurrentPower', async () => {
      expect(await contract.totalCurrentPower()).to.equal(9);
    });

    it('expect totalCurrentPower', async () => {
      expect(await contract.totalCurrentPower()).to.equal(9);
    });

    it('expect transactionCount = 0', async () => {
      expect(await contract.transactionCount()).to.equal(0);
    });

    it('expect ownersCount to be 3', async () => {
      expect(await contract.ownersCount()).to.equal(3);
    });

    it('expect owners to be valid addresses', async () => {
      [superOwnerAddress, owner1Address, owner2Address].forEach(async (owner, i) => {
        expect(await contract.owners(i)).to.eq(owner, `owner ${i} invalid`);
      });
    });

    it('expect owners to have valid power', async () => {
      [superOwnerAddress, owner1Address, owner2Address].forEach(async (owner, i) => {
        expect(await contract.ownersPowers(owner)).to.eq(powers[i], `owner ${i} has invalid power`);
      });
    });

    it('expect to sum the numbers', async () => {
      expect(await contract.sum([1, 2, 3])).to.eq(6);
    });

    it('expect to createFunctionSignature', async () => {
      expect(await contract.createFunctionSignature('createFunctionSignature(string)')).to.eq('0x42a20de2');
    });
  });

  describe('.receive()', () => {
    it('throw when sending ETH', async () => {
      await expect(deployer.sendTransaction({to: contract.address})).to.be.reverted;
      await expect(deployer.sendTransaction({to: contract.address, value: 1})).to.be.reverted;
      expect(await ethBalanceOf(contract.address)).to.eq(0);
    });
  });

  describe('test modifiers', () => {
    describe('.onlyWallet', () => {
      it('expect to throw when NOT executed by multisig', async () => {
        await expect(contract.addOwner(anyWalletAddress, 1))
          .to.be.revertedWith('revert only MultiSigMinter can execute this')
      });

      describe('when acting as multisig', () => {
        it('.whenOwnerDoesNotExist throws when owner already exists', async () => {
          await expect(contract.connect(superOwner).submitAddOwner(superOwnerAddress, 1))
            .to.be.revertedWith('owner already exists')
        });

        it('.notNull throws when address empty', async () => {
          await expect(contract.connect(superOwner).submitAddOwner(ethers.constants.AddressZero, 1))
            .to.be.revertedWith('address is empt')
        });

        it('.whenOwnerExists throws when owner NOT exists', async () => {
          await expect(contract.connect(superOwner).submitRemoveOwner(anyWalletAddress))
            .to.be.revertedWith('owner do NOT exists')
        });

        it('.whenTransactionExists throws when tx do NOT exists', async () => {
          await expect(contract.connect(superOwner).confirmTransaction(1))
            .to.be.revertedWith('revert transaction does not exists')
        });

        it('.whenConfirmedBy', async () => {
          await contract.connect(owner1).submitAddOwner(anyWalletAddress, 1)

          await expect(contract.connect(owner2).executeTransaction(0))
            .to.be.revertedWith('revert transaction NOT confirmed by owner')

          await expect(contract.connect(owner2).confirmTransaction(0)).not.to.be.reverted
        });

        it('.notConfirmedBy', async () => {
          await contract.connect(owner1).submitAddOwner(anyWalletAddress, 1)

          await expect(contract.connect(owner2).confirmTransaction(0)).not.to.be.reverted

          await expect(contract.connect(owner2).confirmTransaction(0))
            .to.be.revertedWith('transaction already confirmed by owner')
        });

        it('.whenNotExecuted', async () => {
          await contract.connect(superOwner).submitAddOwner(anyWalletAddress, 1)

          await expect(contract.connect(superOwner).executeTransaction(0))
            .to.be.revertedWith('transaction already executed')
        });

        it('.validRequirement tests', async () => {
          await expect(contract.connect(superOwner).submitChangeRequiredPower(10))
            .to.be.revertedWith('owners do NOT have enough power');

          await expect(contract.connect(superOwner).submitChangeRequiredPower(0))
            .to.be.revertedWith('_requiredPower is zero');

          await contract.connect(superOwner).submitAddOwner(owner3Address, 1)
          await contract.connect(superOwner).submitAddOwner(deployerAddress, 1)
          await expect(contract.connect(superOwner).submitAddOwner(anyWalletAddress, 1))
            .to.be.revertedWith('too many owners');

          await contract.connect(superOwner).submitRemoveOwner(deployerAddress)
          await contract.connect(superOwner).submitRemoveOwner(owner3Address)
          await contract.connect(superOwner).submitRemoveOwner(owner2Address)
          await contract.connect(superOwner).submitRemoveOwner(owner1Address)

          await expect(contract.connect(superOwner).submitRemoveOwner(superOwnerAddress))
            .to.be.revertedWith('can\'t remove owner, because there will be not enough power left');
        });
      })
    });

    describe('.whenOwnerDoesNotExist', () => {
      it('expect to throw when NOT executed by multisig', async () => {
        await expect(contract.addOwner(anyWalletAddress, 1))
          .to.be.revertedWith('revert only MultiSigMinter can execute this')
      });
    });
  });

  describe('.addOwner()', () => {
    it('expect to throw when no power', async () => {
      await expect(contract.connect(superOwner).submitAddOwner(anyWalletAddress, 0))
        .to.be.revertedWith('_power is empty')
    });

    it('expect to add owner', async () => {
      const ownersCount = await contract.ownersCount();
      const totalCurrentPower = await contract.totalCurrentPower();
      await contract.connect(superOwner).submitAddOwner(anyWalletAddress, 1)

      expect(await contract.ownersPowers(anyWalletAddress)).to.eq(1, 'expect new owner to has power')
      expect(await contract.ownersCount()).to.be.gt(ownersCount, 'expect to increase owners count')
      expect(await contract.totalCurrentPower()).to.eq(totalCurrentPower.add(1), 'expect valid totalCurrentPower')
    });
  })

  describe('.removeOwner()', () => {
    it('expect to throw when remove too much', async () => {
      await contract.connect(superOwner).submitRemoveOwner(owner2Address)
      await contract.connect(superOwner).submitRemoveOwner(owner1Address)

      await expect(contract.connect(superOwner).submitRemoveOwner(superOwnerAddress))
        .to.be.revertedWith('will be not enough power left')
    });

    it('expect to remove owner', async () => {
      const ownersCount = await contract.ownersCount();
      const totalCurrentPower = await contract.totalCurrentPower();
      await contract.connect(superOwner).submitRemoveOwner(owner1Address)

      expect(await contract.owners(1)).to.eq(owner2Address, 'should not lose owner2')
      expect(await contract.owners(0)).to.eq(superOwnerAddress, 'should not lose superOwner')
      expect(await contract.ownersPowers(owner1Address)).to.eq(0, 'expect no power')
      expect(await contract.ownersCount()).to.be.lt(ownersCount, 'expect to increase owners count')

      expect(await contract.totalCurrentPower())
        .to.eq(totalCurrentPower.sub(powers[1]), 'expect valid totalCurrentPower')
    });
  })

  describe('.replaceOwner()', () => {
    it('expect to replace owner', async () => {
      const ownersCount = await contract.ownersCount();
      const totalCurrentPower = await contract.totalCurrentPower();
      await contract.connect(superOwner).submitReplaceOwner(owner2Address, anyWalletAddress)

      expect(await contract.ownersPowers(owner2Address)).to.eq(0, 'removed onwer should have no power')
      expect(await contract.ownersPowers(anyWalletAddress)).to.gt(0, 'new onwer should have power')
      expect(await contract.ownersCount()).to.eq(ownersCount, 'owners count should not change')
      expect(await contract.totalCurrentPower()).to.eq(totalCurrentPower, 'totalCurrentPower should not change')
    });
  })

  describe('.changeRequiredPower()', () => {
    it('expect to change required power', async () => {
      await contract.connect(superOwner).submitChangeRequiredPower(3)
      expect(await contract.requiredPower()).to.eq(3)
    });
  });

  describe('.isConfirmed()', () => {
    it('returns false for non existing tx', async () => {
      expect(await contract.isConfirmed(1)).to.be.false
    });

    it('returns false for non confirmed tx', async () => {
      await contract.connect(owner1).submitChangeRequiredPower(3)
      expect(await contract.isConfirmed(0)).to.be.false
    });

    it('returns true for confirmed tx', async () => {
      await contract.connect(superOwner).submitChangeRequiredPower(3)
      expect(await contract.isConfirmed(0)).to.be.true
    });
  });

  describe('.isExceuted()', () => {
    it('returns false for non existing tx', async () => {
      expect(await contract.isExceuted(1)).to.be.false
    });

    it('returns false for non executed tx', async () => {
      await contract.connect(owner1).submitChangeRequiredPower(3)
      expect(await contract.isExceuted(0)).to.be.false
    });

    it('returns true for executed tx', async () => {
      await contract.connect(superOwner).submitChangeRequiredPower(3)
      expect(await contract.isExceuted(0)).to.be.true
    });
  });

  describe('.revokeLogConfirmation()', () => {
    it('expect to revoke confirmation', async () => {
      await contract.connect(owner2).submitChangeRequiredPower(0)
      expect(await contract.getLogConfirmationCount(0)).to.eq(1);

      await contract.connect(owner2).revokeLogConfirmation(0)
      expect(await contract.getLogConfirmationCount(0)).to.eq(0);
    });
  });

  describe('.executeTransaction()', () => {
    const id = 1;

    beforeEach(async () => {
      await contract.connect(superOwner).submitChangeRequiredPower(9);
      await contract.connect(superOwner).submitChangeRequiredPower(4);
    });

    it('throws when not confirmed by owner', async () => {
      await expect(contract.connect(owner2).executeTransaction(id))
        .to.be.revertedWith('transaction NOT confirmed by owner');
    });

    it('expect to execute only when confirmed', async () => {
      expect(await contract.isConfirmed(id)).to.eq(false, 'should not be confirmed yet');
      await expect(contract.connect(superOwner).executeTransaction(id)).to.not.emit(contract, 'LogExecution');
      await expect(contract.connect(superOwner).executeTransaction(id)).to.not.be.reverted;

      expect(await contract.connect(owner2).confirmTransaction(id))
        .to.emit(contract, 'LogConfirmation').withArgs(owner2Address, id);

      await expect(contract.connect(owner1).confirmTransaction(id))
        .to.emit(contract, 'LogExecution').withArgs(id, '0x');
    });

    it('getTransactionShort returns tx details', async () => {
      const details = await contract.getTransactionShort(id)

      expect(details[0]).to.eq(contract.address, 'destination invalid')
      expect(details[1]).to.eq(0, 'value invalid')
      expect(details[2]).to.eq(0, 'executed invalid')
    });
  });

  describe('.getTransaction() and .getTransactionShort()', () => {
    beforeEach(async () => {
      await contract.connect(owner1).submitChangeRequiredPower(256)
    });

    it('getTransaction returns tx details', async () => {
      const details = await contract.getTransaction(0)

      expect(details[0]).to.eq(contract.address, 'destination invalid')
      expect(details[1]).to.eq(0, 'value invalid')
      expect(details[2]).to.eq(0, 'executed invalid')

      expect(details[3])
        .to.eq('0x75bd1cc90000000000000000000000000000000000000000000000000000000000000100', 'data invalid')
    });

    it('getTransactionShort returns tx details', async () => {
      const details = await contract.getTransactionShort(0)

      expect(details[0]).to.eq(contract.address, 'destination invalid')
      expect(details[1]).to.eq(0, 'value invalid')
      expect(details[2]).to.eq(0, 'executed invalid')
    });
  });

  describe('.getLogConfirmationCount()', () => {
    it('return 0 when no confirmations', async () => {
      expect(await contract.getLogConfirmationCount(0)).to.eq(0)
    });

    it('return 1 when one owner confirmed', async () => {
      await contract.connect(owner1).submitChangeRequiredPower(256)
      expect(await contract.getLogConfirmationCount(0)).to.eq(1)
    });

    it('return 2 when 2 owners confirmed', async () => {
      await expect(contract.connect(owner1).submitChangeRequiredPower(1))
        .to.emit(contract, 'LogSubmission').withArgs(0)

      await contract.connect(owner2).confirmTransaction(0)
      expect(await contract.getLogConfirmationCount(0)).to.eq(2)
    });
  });

  describe('helpers', () => {
    beforeEach(async () => {
      // I just want to have any tx executed, to I can test case with txId > 0
      await contract.connect(superOwner).submitChangeRequiredPower(4);
    });

    it('expect to revert if tx on destination contract reverts', async () => {
      await stakingRewards.mock.notifyRewardAmount.withArgs(555).reverts();

      await expect(contract.connect(superOwner)
        .submitStakingRewardsNotifyRewardAmountTx(stakingRewards.address, 555))
        .to.revertedWith('Mock revert')
    });

    describe('.submitTokenMintTx() with not enough power to execute', () => {
      const id = 1;
      const amount = 123;
      const pending = true;
      const executed = true;

      beforeEach(async () => {
        await contract.connect(owner1).submitTokenMintTx(umb.address, owner2Address, amount);
      });

      it('getTransaction returns tx details', async () => {
        const [destination, value, executed, data] = await contract.getTransaction(id)

        expect(destination).to.eq(umb.address, 'destination is invalid')
        expect(value).to.eq(0, 'value is invalid')
        expect(executed).to.eq(0, 'executed is invalid')
        expect(data).to.eq(
          '0x40c10f19000000000000000000000000' + owner2Address.slice(2).toLowerCase() +
          '00000000000000000000000000000000000000000000000000000000000000' + amount.toString(16),
          'data is invalid')
      });

      it('checks for state', async () => {
        expect(await contract.isExceuted(id)).to.eq(false, 'isExecuted failed')
        expect(await contract.isConfirmed(id)).to.eq(false, 'isConfirmed failed')
        expect(await contract.getLogConfirmationCount(id)).to.eq(1, 'confirmation count is invalid');
        expect(await contract.getTransactionCount(pending, !executed)).to.eq(1, 'tx should be pending');
        expect(await contract.getTransactionCount(!pending, executed)).to.eq(1, 'expect one past tx');

        const confirmations = await contract.getLogConfirmations(id);

        expect(confirmations)
          .to.eql([owner1Address], 'should be confirmed by valid owners')

        let ids = await contract.getTransactionIds(0, 2, pending, !executed)
        expect(ids).to.eql([BigNumber.from(id)], 'only current tx should be returned');

        ids = await contract.getTransactionIds(0, 2, !pending, executed)
        expect(ids).to.eql([BigNumber.from(0)], 'old tx should be returned');
      });

      describe('when tx confirmed and executed', () => {
        beforeEach(async () => {
          await umb.mock.mint.withArgs(owner2Address, amount).returns();
          await contract.connect(superOwner).confirmTransaction(id);
        });

        it('checks for execution', async () => {
          expect(await contract.isExceuted(id)).to.eq(true, 'isExecuted failed')
          expect(await contract.isConfirmed(id)).to.eq(true, 'isConfirmed failed')
          expect(await contract.getLogConfirmationCount(id)).to.eq(2, 'expect 2 owners');

          const confirmations = await contract.getLogConfirmations(id);

          expect(confirmations)
            .to.eql([superOwnerAddress, owner1Address], 'should be confirmed by valid owners')

          expect(await contract.getTransactionCount(pending, !executed)).to.eq(0, 'tx should not be pending');
          expect(await contract.getTransactionCount(!pending, executed)).to.eq(2, 'tx should be executed');

          let ids = await contract.getTransactionIds(0, 2, pending, !executed)
          expect(ids).to.eql([], 'all tx are executed so list should be empty');

          ids = await contract.getTransactionIds(1, 2, !pending, executed)
          expect(ids).to.eql([BigNumber.from(id)], 'tx should be found');
        });
      });
    });

    it('executes UMB.setRewardTokens()', async () => {
      const params = [[rUmb.address], [true]];
      await umb.mock.setRewardTokens.withArgs(...params).returns();

      await expect(contract.connect(superOwner).submitUMBSetRewardTokensTx(umb.address, ...params))
        .to.emit(contract, 'LogExecution').withArgs(1, '0x')
    })

    it('executes rUMB.startEarlySwap()', async () => {
      await rUmb.mock.startEarlySwap.withArgs().returns();

      await expect(contract.connect(superOwner).submitRUMBStartEarlySwapTx(rUmb.address))
        .to.emit(contract, 'LogExecution').withArgs(1, '0x')
    })

    it('executes StakingRewards.setRewardsDistribution()', async () => {
      await stakingRewards.mock.setRewardsDistribution.withArgs(anyWalletAddress).returns();

      await expect(contract.connect(superOwner)
        .submitStakingRewardsSetRewardsDistributionTx(stakingRewards.address, anyWalletAddress))
        .to.emit(contract, 'LogExecution').withArgs(1, '0x')
    })

    it('executes StakingRewards.setRewardsDuration()', async () => {
      await stakingRewards.mock.setRewardsDuration.withArgs(1234).returns();

      await expect(contract.connect(superOwner)
        .submitStakingRewardsSetRewardsDurationTx(stakingRewards.address, 1234))
        .to.emit(contract, 'LogExecution').withArgs(1, '0x')
    })

    it('executes StakingRewards.finishFarming()', async () => {
      await stakingRewards.mock.finishFarming.returns();

      await expect(contract.connect(superOwner)
        .submitStakingRewardsFinishFarmingTx(stakingRewards.address))
        .to.emit(contract, 'LogExecution').withArgs(1, '0x')
    })
  });
});
