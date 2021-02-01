import {artifacts, ethers} from 'hardhat';
import {solidity} from 'ethereum-waffle';
import chai, {expect} from 'chai';
import {Signer} from 'ethers';
import {Contract} from '@ethersproject/contracts';
import web3 from 'web3';
import {deployMockContract} from '@ethereum-waffle/mock-contract';

import {oneYear} from '../scripts/helpers';

chai.use(solidity);

describe('rUMB', async () => {
  const swapDelay = oneYear;
  const name = web3.utils.randomHex(16), symbol = name.substring(8);

  let rUMB: Contract, swapReceiver: Contract;
  let initialBalance: number, maxAllowedTotalSupply: number, totalAmountToBeSwapped: number, swapDuration: number;
  let owner: Signer, ownerAddress: string;
  let holder: Signer, holderAddress: string;

  beforeEach(async () => {
    ({
      swapReceiver,
      swapDuration,
      totalAmountToBeSwapped,
      initialBalance,
      maxAllowedTotalSupply,
      owner,
      holder,
      rUMB,
      ownerAddress,
      holderAddress
    } = await setup(0, 100, 23));
  });

  const setup = async (initialBalance: number, maxAllowedTotalSupply: number, swapDuration: number) => {
    const [owner, holder, holder2] = await ethers.getSigners();

    const contract = await ethers.getContractFactory('rUMB');
    const swapReceiver = await deployMockContract(owner, (await artifacts.readArtifact('ISwapReceiver')).abi);

    const rUMB = await contract.deploy(
      owner.address,
      holder.address,
      initialBalance,
      maxAllowedTotalSupply,
      swapDuration,
      name,
      symbol
    );

    await rUMB.deployed();

    const {timestamp: timeDeployed} = await ethers.provider.getBlock('latest');

    return {
      timeDeployed,
      swapReceiver,
      swapDuration,
      initialBalance,
      maxAllowedTotalSupply,
      owner,
      ownerAddress: owner.address,
      holderAddress: holder.address,
      holder,
      holder2Address: holder2.address,
      holder2,
      rUMB,
      totalAmountToBeSwapped: maxAllowedTotalSupply
    };
  };

  describe('.rUMB()', () => {
    describe('with an initial holder', () => {
      beforeEach(async () => {
        ({
          swapReceiver,
          swapDuration,
          totalAmountToBeSwapped,
          initialBalance,
          maxAllowedTotalSupply,
          owner,
          holder,
          rUMB,
          ownerAddress,
          holderAddress
        } = await setup(50, 100, 10));
      });

      it('Should create a contract with an assigned owner', async () => {
        expect(await rUMB.owner()).to.equal(ownerAddress, 'UMB contract belongs to the owner');
      });

      it('Checks name', async () => {
        expect(await rUMB.name()).to.equal(name);
      });

      it('Checks symbol', async () => {
        expect(await rUMB.symbol()).to.equal(symbol);
      });

      it('The initial supply should match the number of tokens of the initial holder', async () => {
        expect(await rUMB.totalSupply()).to.equal(initialBalance);
      });

      it('The balance of the initial holder is correct', async () => {
        expect(await rUMB.balanceOf(holderAddress)).to.equal(initialBalance);
      });

      it('The maximum allowed total supply is correct', async () => {
        expect(await rUMB.maxAllowedTotalSupply()).to.equal(maxAllowedTotalSupply);
      });

      it('The total amount to be swapped is correct', async () => {
        expect(await rUMB.totalAmountToBeSwapped()).to.equal(totalAmountToBeSwapped);
      });

      it('The number of swapped tokens is zero', async () => {
        expect(await rUMB.swappedSoFar()).to.equal(0);
      });

      it('Swap duration is correct', async () => {
        expect(await rUMB.swapDuration()).to.equal(swapDuration);
      });

      it('swapStartsOn is correct', async () => {
        const {timestamp} = await ethers.provider.getBlock('latest');
        expect(await rUMB.swapStartsOn()).to.equal(timestamp + swapDelay);
      });
    });

    describe('without an initial holder', () => {
      it('Initial supply should match the number of tokens of the initial holder', async () => {
        expect(await rUMB.totalSupply()).to.equal(0);
      });

      it('The balance of the initial holder is correct', async () => {
        expect(await rUMB.balanceOf(holderAddress)).to.equal(0);
      });

      it('The maximum allowed total supply is correct', async () => {
        expect(await rUMB.maxAllowedTotalSupply()).to.equal(maxAllowedTotalSupply);
      });
    });

    it('Total supply cannot be equal to zero', async () => {
      const contract = await ethers.getContractFactory('rUMB');

      await expect(contract.deploy(ownerAddress, ethers.constants.AddressZero, 0, 0, swapDuration, name, symbol))
        .to.revertedWith('revert _maxAllowedTotalSupply is empty');
    });

    it('Swap duration cannot be equal to zero', async () => {
      const contract = await ethers.getContractFactory('rUMB');

      await
        expect(contract.deploy(ownerAddress, ethers.constants.AddressZero, 0, maxAllowedTotalSupply, 0, name, symbol))
        .to.revertedWith('revert swapDuration is empty');
    });
  });

  describe('.mint()', async () => {
    it('The owner can mint tokens', async () => {
      await expect(rUMB.mint(holderAddress, maxAllowedTotalSupply))
        .to.emit(rUMB, 'Transfer').withArgs(ethers.constants.AddressZero, holderAddress, maxAllowedTotalSupply);
    });

    it('The total supply changes after some tokens were minted', async () => {
      await rUMB.mint(holderAddress, maxAllowedTotalSupply);
      expect(await rUMB.totalSupply()).to.equal(maxAllowedTotalSupply);
    });

    it('The balance changes after some tokens were minted', async () => {
      await rUMB.mint(holderAddress, maxAllowedTotalSupply);
      expect(await rUMB.balanceOf(holderAddress)).to.equal(maxAllowedTotalSupply);
    });

    it('The owner cannot mint more tokens than the maximum supply', async () => {
      await expect(rUMB.mint(holderAddress, maxAllowedTotalSupply + 1))
        .to.revertedWith('revert total supply limit exceeded');
    });

    it('Nobody else can mint tokens', async () => {
      await expect(rUMB.connect(holder).mint(holderAddress, maxAllowedTotalSupply))
        .to.revertedWith('revert Ownable: caller is not the owner');
    });
  });

  describe('.burn()', async () => {
    beforeEach(async () => {
      ({holder, rUMB, holderAddress} = await setup(50, 100, 10));
    });

    it('Anyone can burn tokens', async () => {
      await expect(rUMB.connect(holder).burn(50))
        .to.emit(rUMB, 'Transfer').withArgs(holderAddress, ethers.constants.AddressZero, 50);
    });

    it('Nobody can burn more tokens than they have', async () => {
      await expect(rUMB.connect(holder).burn(51)).to.revertedWith('revert not enough tokens to burn');
    });

    it('Maximum supply drops when tokens burn', async () => {
      await rUMB.connect(holder).burn(50);
      expect(await rUMB.maxAllowedTotalSupply()).to.equal(maxAllowedTotalSupply - 50);
    });
  });

  describe('.isSwapStarted()', () => {
    it('Swap is not started initially', async () => {
      expect(await rUMB.isSwapStarted()).to.equal(false);
    });

    it('Swap starts in a year', async () => {
      await ethers.provider.send('evm_increaseTime', [swapDelay - 1]);
      await ethers.provider.send('evm_mine', []);
      expect(await rUMB.isSwapStarted()).to.equal(false);

      await ethers.provider.send('evm_mine', []);
      expect(await rUMB.isSwapStarted()).to.equal(true);
    });
  });

  describe('.startEarlySwap()', () => {
    it('Owner can start early swap', async () => {
      const {timestamp} = await ethers.provider.getBlock('latest');

      await expect(rUMB.startEarlySwap()).to.emit(rUMB, 'LogStartEarlySwapNow').withArgs(timestamp + 1);
    });

    it('Others cannot start early swap', async () => {
      await expect(rUMB.connect(holder).startEarlySwap()).to.revertedWith('revert Ownable: caller is not the owner');
    });

    it('Cannot start early swap if the swapping period has already started', async () => {
      await ethers.provider.send('evm_increaseTime', [swapDelay]);
      await expect(rUMB.startEarlySwap()).to.revertedWith('revert swap is already allowed');
    });
  });

  describe('.totalUnlockedAmountOfToken()', () => {
    beforeEach(async () => {
      await rUMB.mint(holderAddress, 67);
    });

    it('Initial unlocked amount is zero', async () => {
      expect(await rUMB.totalUnlockedAmountOfToken()).to.equal(0);
    });

    it('Unlocked amount stays zero for a year', async () => {
      await ethers.provider.send('evm_increaseTime', [swapDelay - 1]);
      await ethers.provider.send('evm_mine', []);
      expect(await rUMB.totalUnlockedAmountOfToken()).to.equal(0);
    });

    it('All tokens are unlocked when duration is exceeded', async () => {
      await ethers.provider.send('evm_increaseTime', [swapDelay + swapDuration]);
      await ethers.provider.send('evm_mine', []);
      expect(await rUMB.totalUnlockedAmountOfToken()).to.equal(67);
    });

    it('The amount of swappable tokens is gradually increasing', async () => {
      await ethers.provider.send('evm_increaseTime', [swapDelay]);

      for (let i = 0; i <= swapDuration; ++i) {
        expect(await rUMB.totalUnlockedAmountOfToken()).to.equal(Math.floor(67 * (i / swapDuration)));
        await ethers.provider.send('evm_mine', []);
      }
    });
  });

  describe('.canSwapTokens()', () => {
    beforeEach(async () => {
      await rUMB.mint(holderAddress, 67);
    });

    it('Initially the holder cannot swap his tokens', async () => {
      expect(await rUMB.canSwapTokens(holderAddress)).to.equal(false);
    });

    it('The holder cannot swap tokens before duration is exceeded', async () => {
      await ethers.provider.send('evm_increaseTime', [swapDelay - 1]);
      await ethers.provider.send('evm_mine', []);
      expect(await rUMB.canSwapTokens(holderAddress)).to.equal(false);
    });

    it('The holder can swap all tokens when duration is exceeded', async () => {
      await ethers.provider.send('evm_increaseTime', [swapDelay + swapDuration]);
      await ethers.provider.send('evm_mine', []);
      expect(await rUMB.canSwapTokens(holderAddress)).to.equal(true);
    });
  });

  describe('.swapFor()', () => {
    beforeEach(async () => {
      await rUMB.mint(holderAddress, 67);
    });

    it('Cannot swap if the swapping period has not started yet', async () => {
      await ethers.provider.send('evm_increaseTime', [swapDelay - 3]);
      await expect(rUMB.swapFor(swapReceiver.address)).to.revertedWith('revert swapping period has not started yet');
    });

    it('Cannot swap if not enough tokens are unlocked', async () => {
      await ethers.provider.send('evm_increaseTime', [swapDelay + swapDuration - 2]);

      await expect(rUMB.connect(holder).swapFor(swapReceiver.address))
        .to.revertedWith('revert your swap is over the limit');
    });

    it('Successfully swapped all tokens', async () => {
      await ethers.provider.send('evm_increaseTime', [swapDelay + swapDuration]);
      await ethers.provider.send('evm_mine', []);

      await swapReceiver.mock.swapMint.withArgs(holderAddress, 67).returns();

      await expect(rUMB.connect(holder).swapFor(swapReceiver.address))
        .to.emit(rUMB, 'LogSwap').withArgs(holderAddress, 67);

      expect(await rUMB.balanceOf(holderAddress)).to.equal(0, 'The owner should have 0 balance');
    });

    it('Successfully burned swapped tokens', async () => {
      await ethers.provider.send('evm_increaseTime', [swapDelay + swapDuration]);
      await ethers.provider.send('evm_mine', []);

      await swapReceiver.mock.swapMint.withArgs(holderAddress, 67).returns();

      await expect(rUMB.connect(holder).swapFor(swapReceiver.address))
        .to.emit(rUMB, 'Transfer').withArgs(holderAddress, ethers.constants.AddressZero, 67);
    });

    it('swappedSoFar was updated', async () => {
      await ethers.provider.send('evm_increaseTime', [swapDelay + swapDuration]);
      await ethers.provider.send('evm_mine', []);

      await swapReceiver.mock.swapMint.withArgs(holderAddress, 67).returns();

      await rUMB.connect(holder).swapFor(swapReceiver.address);

      expect(await rUMB.swappedSoFar()).to.equal(67);
    });

    it('Cannot swap with zero balance', async () => {
      await ethers.provider.send('evm_increaseTime', [swapDelay + swapDuration]);
      await ethers.provider.send('evm_mine', []);

      await swapReceiver.mock.swapMint.withArgs(holderAddress, 67).returns();
      await rUMB.connect(holder).swapFor(swapReceiver.address);

      await expect(rUMB.connect(holder).swapFor(swapReceiver.address))
        .to.revertedWith('revert you dont have tokens to swap');
    });
  });

  it('Cannot send ETH to the contract', async () => {
    await expect(owner.sendTransaction({
      from: ownerAddress,
      to: rUMB.address,
      value: '0x20'
    })).to.revertedWith('Transaction reverted');
  });

  it('Can transfer ownership to another address', async () => {
    expect(await rUMB.owner()).to.equal(ownerAddress, 'Rewards contract belongs to the owner');
    await rUMB.transferOwnership(holderAddress);
    expect(await rUMB.owner()).to.equal(holderAddress, 'Rewards contract should belong to another address');
  });

  describe('UMB integration', () => {
    let UMB: Contract;

    beforeEach(async () => {
      const contract = await ethers.getContractFactory('UMB');
      UMB = await contract.deploy(ownerAddress, ethers.constants.AddressZero, 0, 100, 'UMB token', 'UMB');
      await UMB.deployed();

      await UMB.setRewardTokens([rUMB.address], [true]);

      await rUMB.mint(holderAddress, 67);

      await ethers.provider.send('evm_increaseTime', [swapDelay + swapDuration]);
      await ethers.provider.send('evm_mine', []);
    });

    it('swapped rUMB generates UMB tokens', async () => {
      await expect(rUMB.connect(holder).swapFor(UMB.address)).to.emit(rUMB, 'LogSwap').withArgs(holderAddress, 67);

      expect(await UMB.balanceOf(holderAddress)).to.equal(67);
    });

    it('Cannot swap if UMB token is not whitelisted', async () => {
      await UMB.setRewardTokens([rUMB.address], [false]);

      await expect(rUMB.connect(holder).swapFor(UMB.address))
        .to.revertedWith('revert only reward token can be swapped');
    });

    it('Cannot swap if UMB token exceeds the maximum amount', async () => {
      await UMB.mint(holderAddress, 34);

      await expect(rUMB.connect(holder).swapFor(UMB.address)).to.revertedWith('revert total supply limit exceeded');
    });
  });
});
