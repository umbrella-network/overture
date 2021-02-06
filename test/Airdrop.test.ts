import {ethers} from 'hardhat';
import {solidity} from 'ethereum-waffle';
import chai, {expect} from 'chai';
import {Signer} from 'ethers';
import {Contract} from '@ethersproject/contracts';

import IERC20 from '@openzeppelin/contracts/build/contracts/IERC20.json';
import {deployMockContract} from '@ethereum-waffle/mock-contract';

chai.use(solidity);

describe('Airdrop', async () => {
  let airdrop: Contract;
  let owner: Signer, ownerAddress: string;
  let holder: Signer, holderAddress: string;
  let token: Contract;

  beforeEach(async () => {
    ({
      token,
      owner,
      ownerAddress,
      holder,
      holderAddress,
      airdrop,
    } = await setup());
  });

  const setup = async () => {
    const [owner, holder] = await ethers.getSigners();

    const contract = await ethers.getContractFactory('Airdrop');
    const airdrop = await contract.deploy(
      owner.address
    );

    await airdrop.deployed();

    const token = await deployMockContract(owner, IERC20.abi);

    return {
      owner,
      ownerAddress: owner.address,
      holder,
      holderAddress: holder.address,
      airdrop,
      token,
    };
  };

  describe('.Airdrop()', () => {
    it('Should create a contract with an assigned owner', async () => {
      expect(await airdrop.owner()).to.equal(ownerAddress, 'UMB contract belongs to the owner');
    });

    it('Can transfer ownership to another address', async () => {
      expect(await airdrop.owner()).to.equal(ownerAddress, 'Airdrop contract belongs to the owner');
      await airdrop.transferOwnership(holderAddress);
      expect(await airdrop.owner()).to.equal(holderAddress, 'Airdrop contract should belong to another address');
    });
  });

  describe('.airdropTokens()', () => {
    it('The owner can assign airdrop tokens', async () => {
      await token.mock.balanceOf.withArgs(airdrop.address).returns(100);
      await token.mock.transfer.withArgs(holderAddress, 100).returns(true);

      await airdrop.airdropTokens(token.address, [holderAddress], [100]);
    });

    it('The number of addresses should be non-zero', async () => {
      await expect(airdrop.airdropTokens(token.address, [], [100]))
        .to.be.revertedWith('there are no _addresses');
    });

    it('The number of amounts should match the number of addresses', async () => {
      await expect(airdrop.airdropTokens(token.address, [holderAddress], []))
        .to.be.revertedWith('the number of _addresses should match _amounts');
    });
  });

  it('Cannot send ETH to the contract', async () => {
    await expect(owner.sendTransaction({
      from: ownerAddress,
      to: airdrop.address,
      value: '0x20'
    })).to.revertedWith('Transaction reverted');
  });
});
