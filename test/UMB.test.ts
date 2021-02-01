import {ethers} from 'hardhat';
import {solidity} from 'ethereum-waffle';
import chai, {expect} from 'chai';
import {Signer} from 'ethers';
import web3 from 'web3';
import {Contract} from '@ethersproject/contracts';

import IERC20 from '@openzeppelin/contracts/build/contracts/IERC20.json';
import {deployMockContract} from '@ethereum-waffle/mock-contract';

chai.use(solidity);

describe('UMB', async () => {
  const name = web3.utils.randomHex(16), symbol = name.substring(8);

  let UMB: Contract;
  let initialBalance: number, maxAllowedTotalSupply: number;
  let owner: Signer, ownerAddress: string;
  let holder: Signer, holderAddress: string;
  let rewardToken1: Contract, rewardToken2: Contract;

  beforeEach(async () => {
    ({rewardToken1, rewardToken2, initialBalance, maxAllowedTotalSupply, owner, holder, UMB, ownerAddress, holderAddress} = await setup(0, 100));
  });

  const setup = async (initialBalance: number, maxAllowedTotalSupply: number) => {
    const [owner, holder] = await ethers.getSigners();

    const contract = await ethers.getContractFactory('UMB');
    const UMB = await contract.deploy(owner.address, holder.address, initialBalance, maxAllowedTotalSupply, name, symbol);
    await UMB.deployed();

    const rewardToken1 = await deployMockContract(owner, IERC20.abi);

    const rewardToken2 = await deployMockContract(owner, IERC20.abi);

    return {initialBalance, maxAllowedTotalSupply, owner, ownerAddress: owner.address, holderAddress: holder.address, holder, UMB, rewardToken1, rewardToken2};
  };

  describe('.UMB()', () => {
    describe('with an initial holder', () => {
      beforeEach(async () => {
        ({initialBalance, maxAllowedTotalSupply, owner, holder, UMB, ownerAddress, holderAddress} = await setup(50, 100));
      });

      it('Should create a contract with an assigned owner', async () => {
        expect(await UMB.owner()).to.equal(ownerAddress, 'UMB contract belongs to the owner');
      });

      it('Checks name', async () => {
        expect(await UMB.name()).to.equal(name);
      });

      it('Checks symbol', async () => {
        expect(await UMB.symbol()).to.equal(symbol);
      });

      it('Initial supply should match the number of tokens of the initial holder', async () => {
        expect(await UMB.totalSupply()).to.equal(initialBalance);
      });

      it('The balance of the initial holder is correct', async () => {
        expect(await UMB.balanceOf(holderAddress)).to.equal(initialBalance);
      });

      it('The maximum allowed total supply is correct', async () => {
        expect(await UMB.maxAllowedTotalSupply()).to.equal(maxAllowedTotalSupply);
      });
    });

    describe('without an initial holder', () => {
      it('Initial supply should match the number of tokens of the initial holder', async () => {
        expect(await UMB.totalSupply()).to.equal(0);
      });

      it('The balance of the initial holder is correct', async () => {
        expect(await UMB.balanceOf(holderAddress)).to.equal(0);
      });

      it('The maximum allowed total supply is correct', async () => {
        expect(await UMB.maxAllowedTotalSupply()).to.equal(maxAllowedTotalSupply);
      });
    });
  });

  describe('.setRewardTokens()', () => {
    it('The owner can assign reward tokens', async () => {
      const addresses = [rewardToken1.address, rewardToken2.address],
        statuses = [true, false];

      await expect(UMB.setRewardTokens(addresses, statuses)).to.emit(UMB, 'LogSetRewardTokens').withArgs(addresses, statuses);
    });

    it('Cannot pass an empty array with reward tokens', async () => {
      await expect(UMB.setRewardTokens([], [])).to.revertedWith('revert please pass a positive number of reward tokens');
    });

    it('Cannot pass a different number of addresses and statuses', async () => {
      await expect(UMB.setRewardTokens([rewardToken1.address], [])).to.revertedWith('revert please pass same number of tokens and statuses');
    });

    it('Only the owner can set reward tokens', async () => {
      const addresses = [rewardToken1.address, rewardToken2.address],
        statuses = [true, false];

      await expect(UMB.connect(holder).setRewardTokens(addresses, statuses)).to.revertedWith('revert Ownable: caller is not the owner');
    });
  });

  describe('.mint()', async () => {
    it('The owner can mint tokens', async () => {
      await expect(UMB.mint(holderAddress, maxAllowedTotalSupply)).to.emit(UMB, 'Transfer').withArgs(ethers.constants.AddressZero, holderAddress, maxAllowedTotalSupply);
    });

    it('The total supply changes after some tokens were minted', async () => {
      await UMB.mint(holderAddress, maxAllowedTotalSupply);
      expect(await UMB.totalSupply()).to.equal(maxAllowedTotalSupply);
    });

    it('The balance changes after some tokens were minted', async () => {
      await UMB.mint(holderAddress, maxAllowedTotalSupply);
      expect(await UMB.balanceOf(holderAddress)).to.equal(maxAllowedTotalSupply);
    });

    it('The owner cannot mint more tokens than the maximum supply', async () => {
      await expect(UMB.mint(holderAddress, maxAllowedTotalSupply + 1)).to.revertedWith('revert total supply limit exceeded');
    });

    it('Nobody else can mint tokens', async () => {
      await expect(UMB.connect(holder).mint(holderAddress, maxAllowedTotalSupply)).to.revertedWith('revert Ownable: caller is not the owner');
    });
  });

  describe('.burn()', async () => {
    beforeEach(async () => {
      ({holder, UMB, holderAddress} = await setup(50, 100));
    });

    it('Anyone can burn tokens', async () => {
      await expect(UMB.connect(holder).burn(50)).to.emit(UMB, 'Transfer').withArgs(holderAddress, ethers.constants.AddressZero, 50);
    });

    it('Nobody can burn more tokens than they have', async () => {
      await expect(UMB.connect(holder).burn(51)).to.revertedWith('revert not enough tokens to burn');
    });

    it('Maximum supply drops when tokens burn', async () => {
      await UMB.connect(holder).burn(50);
      expect(await UMB.maxAllowedTotalSupply()).to.equal(maxAllowedTotalSupply - 50);
    });
  });

  describe('.swapMint()', async () => {
    beforeEach(async () => {
      ({holder, holderAddress, UMB} = await setup(50, 100));

      await expect(UMB.setRewardTokens([holderAddress], [true])).to.emit(UMB, 'LogSetRewardTokens').withArgs([holderAddress], [true]);
    });

    it('An assigned caller can mint tokens', async () => {
      await expect(UMB.connect(holder).swapMint(ownerAddress, 50)).to.emit(UMB, 'Transfer').withArgs(ethers.constants.AddressZero, ownerAddress, 50);
    });

    it('Cannot mint more than the maximum supply', async () => {
      await expect(UMB.connect(holder).swapMint(holderAddress, 51)).to.revertedWith('revert total supply limit exceeded');
    });

    it('Unassigned caller cannot mint tokens', async () => {
      await expect(UMB.swapMint(holderAddress, 50)).to.revertedWith('revert only reward token can be swapped');
    });
  });

  it('Cannot send ETH to the contract', async () => {
    await expect(owner.sendTransaction({from: ownerAddress, to: UMB.address, value: '0x20'})).to.revertedWith('Transaction reverted');
  });

  it('Can transfer ownership to another address', async () => {
    expect(await UMB.owner()).to.equal(ownerAddress, 'Rewards contract belongs to the owner');
    await UMB.transferOwnership(holderAddress);
    expect(await UMB.owner()).to.equal(holderAddress, 'Rewards contract should belong to another address');
  });
});

