import hre from 'hardhat'; // require for IntelliJ to run tests
import '@nomiclabs/hardhat-waffle'; // require for IntelliJ to run tests
import {ethers} from 'hardhat';
import {expect} from 'chai';
import {BigNumber, ContractFactory, Signer, Contract} from 'ethers';
import {deployMockContract} from '@ethereum-waffle/mock-contract';
import {MockContract} from 'ethereum-waffle';

import {getArtifacts, getProvider} from '../scripts/helpers';

const [UMB, rUMB1, StakingRewards, Strings] =
  getArtifacts(hre, 'UMB', 'rUMB1', 'StakingRewards', 'Strings');

const UMB_MULTISIG = 'UmbMultiSig';

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

  let umb: MockContract;
  let rUmb: MockContract;
  let stakingRewards: MockContract;
  let contract: Contract;

  const txData = (targetContarctName: string, method: string, args: unknown[]): string => {
    const contractArtifacts = hre.artifacts.readArtifactSync(targetContarctName);
    const iface = new ethers.utils.Interface(contractArtifacts.abi);
    return iface.encodeFunctionData(method, args);
  }

  const setup = async () => {
    const [deployer, owner1, owner2, owner3, superOwner, anyWallet] = await ethers.getSigners();
    const provider = getProvider();
    const umb = await deployMockContract(deployer, UMB.abi);

    const rUmb = await deployMockContract(deployer, rUMB1.abi);

    const stakingRewards = await deployMockContract(deployer, StakingRewards.abi);

    const stringsFactory = new ContractFactory(Strings.abi, Strings.bytecode, deployer);
    const stringsLibrary = await stringsFactory.deploy();

    const contractFactory = await hre.ethers.getContractFactory('UmbMultiSig', {
      signer: deployer,
      libraries: {
        Strings: stringsLibrary.address,
      }
    });

    const contract = await contractFactory.deploy(
      [await superOwner.getAddress(), await owner1.getAddress(), await owner2.getAddress()],
      powers,
      requiredPower,
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
      expect(await contract.owners(0)).not.eq(ethers.constants.AddressZero);
      expect(await contract.owners(1)).not.eq(ethers.constants.AddressZero);
      expect(await contract.owners(2)).not.eq(ethers.constants.AddressZero);
      await expect(contract.owners(3)).to.be.reverted;
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
    it('emits event on sending ETH', async () => {
      await expect(deployer.sendTransaction({to: contract.address, value: 1})).emit(contract, 'LogDeposit');
    });
  });

  describe('test modifiers', () => {
    describe('.onlyWallet', () => {
      it('expect to throw when NOT executed by multisig', async () => {
        await expect(contract.addOwner(anyWalletAddress, 1))
          .to.be.revertedWith('only MultiSigMinter can execute this')
      });

      describe('when acting as multisig', () => {
        it('.whenOwnerDoesNotExist throws when owner already exists', async () => {
          const data = txData(UMB_MULTISIG, 'addOwner', [superOwnerAddress, 1]);

          await expect(contract.connect(superOwner).submitTransaction(contract.address, 0, data))
            .to.be.reverted; // With('owner already exists')
        });

        it('.notNull throws when address empty', async () => {
          const data = txData(UMB_MULTISIG, 'addOwner', [ethers.constants.AddressZero, 1]);

          await expect(contract.connect(superOwner).submitTransaction(contract.address, 0, data))
            .to.be.reverted; // With('address is empty')
        });

        it('.whenOwnerExists throws when owner NOT exists', async () => {
          const data = txData(UMB_MULTISIG, 'removeOwner', [anyWalletAddress]);

          await expect(contract.connect(superOwner).submitTransaction(contract.address, 0, data))
            .to.be.reverted; // With('owner do NOT exists')
        });

        it('.whenTransactionExists throws when tx do NOT exists', async () => {
          await expect(contract.connect(superOwner).confirmTransaction(1))
            .to.be.revertedWith('does not exists')
        });

        it('.whenConfirmedBy', async () => {
          const data = txData(UMB_MULTISIG, 'addOwner', [anyWalletAddress, 1]);
          await contract.connect(owner1).submitTransaction(contract.address, 0, data);

          await expect(contract.connect(owner2).executeTransaction(0))
            .to.be.revertedWith('NOT confirmed by owner')

          await expect(contract.connect(owner2).confirmTransaction(0)).not.to.be.reverted
        });

        it('.notConfirmedBy', async () => {
          const data = txData(UMB_MULTISIG, 'addOwner', [anyWalletAddress, 1]);
          await contract.connect(owner1).submitTransaction(contract.address, 0, data)

          await expect(contract.connect(owner2).confirmTransaction(0)).not.to.be.reverted

          await expect(contract.connect(owner2).confirmTransaction(0))
            .to.be.revertedWith('already confirmed by owner')
        });

        it('.whenNotExecuted', async () => {
          const data = txData(UMB_MULTISIG, 'addOwner', [anyWalletAddress, 1]);
          await contract.connect(superOwner).submitTransaction(contract.address, 0, data);

          await expect(contract.connect(superOwner).executeTransaction(0))
            .to.be.revertedWith('already executed')
        });

        it('.validRequirement tests', async () => {
          let data = txData(UMB_MULTISIG, 'changeRequiredPower', [10]);

          await expect(contract.connect(superOwner).submitTransaction(contract.address, 0, data))
            .to.be.reverted; // With('owners do NOT have enough power');

          data = txData(UMB_MULTISIG, 'changeRequiredPower', [0]);

          await expect(contract.connect(superOwner).submitTransaction(contract.address, 0, data))
            .to.be.reverted; // With('_requiredPower is zero');

          const data1 = txData(UMB_MULTISIG, 'addOwner', [owner3Address, 1]);
          await contract.connect(superOwner).submitTransaction(contract.address, 0, data1);

          const data2 = txData(UMB_MULTISIG, 'addOwner', [deployerAddress, 1]);
          await contract.connect(superOwner).submitTransaction(contract.address, 0, data2);

          data = txData(UMB_MULTISIG, 'removeOwner', [deployerAddress]);
          await contract.connect(superOwner).submitTransaction(contract.address, 0, data);

          data = txData(UMB_MULTISIG, 'removeOwner', [owner3Address]);
          await contract.connect(superOwner).submitTransaction(contract.address, 0, data);

          data = txData(UMB_MULTISIG, 'removeOwner', [owner2Address]);
          await contract.connect(superOwner).submitTransaction(contract.address, 0, data);

          data = txData(UMB_MULTISIG, 'removeOwner', [owner1Address]);
          await contract.connect(superOwner).submitTransaction(contract.address, 0, data);

          data = txData(UMB_MULTISIG, 'removeOwner', [superOwnerAddress]);

          await expect(contract.connect(superOwner).submitTransaction(contract.address, 0, data))
            .to.be.reverted; // With('can\'t remove owner, because there will be not enough power left');
        });
      })
    });

    describe('.whenOwnerDoesNotExist', () => {
      it('expect to throw when NOT executed by multisig', async () => {
        await expect(contract.addOwner(anyWalletAddress, 1))
          .to.be.revertedWith('only MultiSigMinter can execute this')
      });
    });
  });

  describe('.addOwner()', () => {
    it('expect to throw when no power', async () => {
      const data = txData(UMB_MULTISIG, 'addOwner', [anyWalletAddress, 0]);

      await expect(contract.connect(superOwner).submitTransaction(contract.address, 0, data))
        .to.be.reverted; // With('_power is empty')
    });

    it('expect to add owner', async () => {
      const totalCurrentPower = await contract.totalCurrentPower();
      const data = txData(UMB_MULTISIG, 'addOwner', [anyWalletAddress, 1]);
      await contract.connect(superOwner).submitTransaction(contract.address, 0, data)

      expect(await contract.ownersPowers(anyWalletAddress)).to.eq(1, 'expect new owner to has power')
      expect(await contract.totalCurrentPower()).to.eq(totalCurrentPower.add(1), 'expect valid totalCurrentPower')
    });
  })

  describe('.removeOwner()', () => {
    it('expect to throw when remove too much', async () => {
      let data = txData(UMB_MULTISIG, 'removeOwner', [owner2Address]);
      await contract.connect(superOwner).submitTransaction(contract.address, 0, data);

      data = txData(UMB_MULTISIG, 'removeOwner', [owner1Address]);
      await contract.connect(superOwner).submitTransaction(owner1Address, 0, data);

      data = txData(UMB_MULTISIG, 'removeOwner', [superOwnerAddress]);
      await expect(contract.connect(superOwner).submitTransaction(contract.address, 0, data))
        .to.be.reverted; // With('will be not enough power left')
    });

    it('expect to remove owner', async () => {
      const totalCurrentPower = await contract.totalCurrentPower();
      const data = txData(UMB_MULTISIG, 'removeOwner', [owner1Address]);
      await contract.connect(superOwner).submitTransaction(contract.address, 0, data);

      expect(await contract.owners(1)).to.eq(owner2Address, 'should not lose owner2')
      expect(await contract.owners(0)).to.eq(superOwnerAddress, 'should not lose superOwner')
      expect(await contract.ownersPowers(owner1Address)).to.eq(0, 'expect no power')

      expect(await contract.totalCurrentPower())
        .to.eq(totalCurrentPower.sub(powers[1]), 'expect valid totalCurrentPower')
    });
  })

  describe('.replaceOwner()', () => {
    it('expect to replace owner', async () => {
      const totalCurrentPower = await contract.totalCurrentPower();
      const data = txData(UMB_MULTISIG, 'replaceOwner', [owner2Address, anyWalletAddress]);
      await contract.connect(superOwner).submitTransaction(contract.address, 0, data);

      expect(await contract.ownersPowers(owner2Address)).to.eq(0, 'removed onwer should have no power')
      expect(await contract.ownersPowers(anyWalletAddress)).to.gt(0, 'new onwer should have power')
      expect(await contract.totalCurrentPower()).to.eq(totalCurrentPower, 'totalCurrentPower should not change')
    });
  })

  describe('.changeRequiredPower()', () => {
    it('expect to change required power', async () => {
      const data = txData(UMB_MULTISIG, 'changeRequiredPower', [3]);
      await contract.connect(superOwner).submitTransaction(contract.address, 0, data);
      expect(await contract.requiredPower()).to.eq(3)
    });
  });

  describe('.isConfirmed()', () => {
    it('returns false for non existing tx', async () => {
      expect(await contract.isConfirmed(1)).to.be.false
    });

    it('returns false for non confirmed tx', async () => {
      const data = txData(UMB_MULTISIG, 'changeRequiredPower', [3]);
      await contract.connect(owner1).submitTransaction(contract.address, 0, data);
      expect(await contract.isConfirmed(0)).to.be.false
    });

    it('returns true for confirmed tx', async () => {
      const data = txData(UMB_MULTISIG, 'changeRequiredPower', [3]);
      await contract.connect(superOwner).submitTransaction(contract.address, 0, data);
      expect(await contract.isConfirmed(0)).to.be.true
    });
  });

  describe('.isExceuted()', () => {
    it('returns false for non existing tx', async () => {
      expect(await contract.isExceuted(1)).to.be.false
    });

    it('returns false for non executed tx', async () => {
      const data = txData(UMB_MULTISIG, 'changeRequiredPower', [3]);
      await contract.connect(owner1).submitTransaction(contract.address, 0, data);
      expect(await contract.isExceuted(0)).to.be.false
    });

    it('returns true for executed tx', async () => {
      const data = txData(UMB_MULTISIG, 'changeRequiredPower', [3]);
      await contract.connect(superOwner).submitTransaction(contract.address, 0, data);
      expect(await contract.isExceuted(0)).to.be.true
    });
  });

  describe('.revokeLogConfirmation()', () => {
    it('expect to revoke confirmation', async () => {
      const data = txData(UMB_MULTISIG, 'changeRequiredPower', [0]);
      await contract.connect(owner2).submitTransaction(contract.address, 0, data);
      expect(await contract.getLogConfirmationCount(0)).to.eq(1);

      await contract.connect(owner2).revokeLogConfirmation(0)
      expect(await contract.getLogConfirmationCount(0)).to.eq(0);
    });
  });

  describe('.executeTransaction()', () => {
    const id = 1;

    beforeEach(async () => {
      let data = txData(UMB_MULTISIG, 'changeRequiredPower', [9]);
      await contract.connect(superOwner).submitTransaction(contract.address, 0, data);
      data = txData(UMB_MULTISIG, 'changeRequiredPower', [4]);
      await contract.connect(superOwner).submitTransaction(contract.address, 0, data);
    });

    it('throws when not confirmed by owner', async () => {
      await expect(contract.connect(owner2).executeTransaction(id))
        .to.be.revertedWith('NOT confirmed by owner');
    });

    it('expect to execute only when confirmed', async () => {
      expect(await contract.isConfirmed(id)).to.eq(false, 'should not be confirmed yet');
      await expect(contract.connect(superOwner).executeTransaction(id)).to.not.emit(contract, 'LogExecution');
      await expect(contract.connect(superOwner).executeTransaction(id)).to.not.be.reverted;

      expect(await contract.connect(owner2).confirmTransaction(id))
        .to.emit(contract, 'LogConfirmation').withArgs(owner2Address, id);

      await expect(contract.connect(owner1).confirmTransaction(id))
        .to.emit(contract, 'LogExecution').withArgs(id);
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
      const data = txData(UMB_MULTISIG, 'changeRequiredPower', [256]);
      await contract.connect(owner1).submitTransaction(contract.address, 0, data);
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
      const data = txData(UMB_MULTISIG, 'changeRequiredPower', [256]);
      await contract.connect(owner1).submitTransaction(contract.address, 0, data);
      expect(await contract.getLogConfirmationCount(0)).to.eq(1)
    });

    it('return 2 when 2 owners confirmed', async () => {
      const data = txData(UMB_MULTISIG, 'changeRequiredPower', [1]);

      await expect(contract.connect(owner1).submitTransaction(contract.address, 0, data))
        .to.emit(contract, 'LogSubmission').withArgs(0)

      await contract.connect(owner2).confirmTransaction(0)
      expect(await contract.getLogConfirmationCount(0)).to.eq(2)
    });
  });

  describe('helpers', () => {
    beforeEach(async () => {
      // I just want to have any tx executed, so I can test case with txId > 0
      const data = txData('UmbMultiSig', 'changeRequiredPower', [4]);
      await contract.connect(superOwner).submitTransaction(contract.address, 0, data);
    });

    it('expect to revert if tx on destination contract reverts', async () => {
      await stakingRewards.mock.notifyRewardAmount.withArgs(555).reverts();

      await expect(contract.connect(superOwner)
        .submitStakingRewardsNotifyRewardAmountTx(stakingRewards.address, 555))
        .to.reverted; // With('Mock revert')
    });

    describe('.submitTokenMintTx() with not enough power to execute', () => {
      const id = 1;
      const amount = 123;
      const pending = true;
      const executed = true;

      beforeEach(async () => {
        expect(await contract.isExceuted(0)).to.eq(true, 'isExecuted failed for #0');
        await contract.connect(owner1).submitTokenMintTx(umb.address, owner2Address, amount);
      });

      it('getTransaction returns tx details', async () => {
        const [destination, value, executed, data] = await contract.getTransaction(id)

        expect(destination).to.eq(umb.address, 'destination is invalid')
        expect(value).to.eq(0, 'value is invalid')
        expect(executed).to.eq(0, 'executed is invalid')
        expect(data).to.eq(txData('UMB', 'mint', [owner2Address, amount]),'data is invalid')
      });

      it('checks for state', async () => {
        expect(await contract.isExceuted(id)).to.eq(false, 'isExecuted failed')
        expect(await contract.isConfirmed(id)).to.eq(false, 'isConfirmed failed')
        expect(await contract.getLogConfirmationCount(id)).to.eq(1, 'confirmation count is invalid');
        expect(await contract.getTransactionCount(pending, !executed)).to.eq(1, 'tx should be pending');
        expect(await contract.getTransactionCount(!pending, executed)).to.eq(1, 'expect one past tx');

        const confirmations = await contract.getLogConfirmations(id);

        expect(confirmations)
          .to.eql([owner1Address], 'should be confirmed by valid owners');

        let ids = (await contract.getTransactionIds(0, 2, !pending, !executed)).map((i: BigNumber) => i.toString());
        expect(ids).to.eql(['0', '0']);

        ids = (await contract.getTransactionIds(0, 2, pending, !executed)).map((i: BigNumber) => i.toString());
        expect(ids.includes(`${id}`)).true;

        ids = (await contract.getTransactionIds(0, 2, !pending, executed)).map((i: BigNumber) => i.toString());
        expect(ids).to.eql(['0', '0'], 'old tx should be returned');
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

          let ids: BigNumber[] = await contract.getTransactionIds(0, 2, pending, !executed)
          expect(ids.filter(i => !i.isZero()).map(i => i.toString()))
            .to.eql([], 'all tx are executed so list should be empty');

          ids = await contract.getTransactionIds(1, 2, !pending, executed)
          expect(ids.map(i => i.toString())).to.eql([id.toString()], 'tx should be found');
        });
      });
    });

    it('executes UMB.setRewardTokens()', async () => {
      const params = [[rUmb.address], [true]];
      await umb.mock.setRewardTokens.withArgs(...params).returns();

      await expect(contract.connect(superOwner).submitUMBSetRewardTokensTx(umb.address, ...params))
        .to.emit(contract, 'LogExecution').withArgs(1)
    })

    it('executes rUMB.startEarlySwap()', async () => {
      await rUmb.mock.startEarlySwap.withArgs().returns();
      const data = txData('rUMB1', 'startEarlySwap', []);

      await expect(contract.connect(superOwner).submitTransaction(rUmb.address, 0, data))
        .to.emit(contract, 'LogExecution').withArgs(1)
    })

    it('executes StakingRewards.setRewardsDistribution()', async () => {
      await stakingRewards.mock.setRewardsDistribution.withArgs(anyWalletAddress).returns();

      await expect(contract.connect(superOwner)
        .submitStakingRewardsSetRewardsDistributionTx(stakingRewards.address, anyWalletAddress))
        .to.emit(contract, 'LogExecution').withArgs(1)
    })

    it('executes StakingRewards.setRewardsDuration()', async () => {
      await stakingRewards.mock.setRewardsDuration.withArgs(1234).returns();

      await expect(contract.connect(superOwner)
        .submitStakingRewardsSetRewardsDurationTx(stakingRewards.address, 1234))
        .to.emit(contract, 'LogExecution').withArgs(1)
    })

    it('executes StakingRewards.finishFarming()', async () => {
      await stakingRewards.mock.finishFarming.returns();
      const data = txData('StakingRewards', 'finishFarming', []);

      await expect(contract.connect(superOwner)
        .submitTransaction(stakingRewards.address, 0, data))
        .to.emit(contract, 'LogExecution').withArgs(1)
    })
  });
});
