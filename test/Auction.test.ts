require('custom-env').env(true);

import {expect, use} from 'chai';
import {waffleChai} from "@ethereum-waffle/chai";
import {loadFixture} from "ethereum-waffle";
import {deployMockContract} from '@ethereum-waffle/mock-contract';
import {Contract} from "@ethersproject/contracts";
import {ContractFactory, Signer} from "ethers";
import {Provider} from '@ethersproject/providers';

import {waitForTx} from "../scripts/helpers";

use(waffleChai);

const UMB = require('../artifacts/contracts/UMB.sol/UMB.json');
const Auction = require('../artifacts/contracts/Auction.sol/Auction.json');

describe('Auction', () => {
  let owner: Signer, umb: Contract, contract: Contract;
  let provider: Provider;

  const fixture = async ([owner]: Signer[], provider: Provider) => {
    const setup = async () => {
      const umb = await deployMockContract(owner, UMB.abi);

      const contractFactory = new ContractFactory(Auction.abi, Auction.bytecode, owner);
      const contract = await contractFactory.deploy(await owner.getAddress(), umb.address, true);

      return {owner, umb, contract, provider};
    };

    return await setup();
  };

  const mockBalanceOf = async (account: string, balance = '0') => {
    await umb.mock.balanceOf.withArgs(account).returns(balance);
  };

  const minimalEthPricePerToken = 2;
  const minimalRequiredLockedEth = 10;
  const maximumLockedEth = 50000;
  const totalUMBOnSale = 1000;

  beforeEach(async () => {
    ({owner, umb, contract, provider} = await loadFixture(fixture));
    await contract.connect(owner).setup(minimalEthPricePerToken, minimalRequiredLockedEth, maximumLockedEth);
  });

  describe('when deployed and setup', () => {
    it('minimalEthPricePerToken is set', async () => {
      expect(await contract.minimalEthPricePerToken()).to.equal(minimalEthPricePerToken);
    });

    it('minimalRequiredLockedEth is set', async () => {
      expect(await contract.minimalRequiredLockedEth()).to.equal(minimalRequiredLockedEth);
    });

    it('maximumLockedEth is set', async () => {
      expect(await contract.maximumLockedEth()).to.equal(maximumLockedEth);
    });

    it('tokenPrice should be 0', async () => {
      expect(await contract.tokenPrice()).to.equal(0);
    });

    it('totalUMBOnSale should be 0', async () => {
      expect(await contract.totalUMBOnSale()).to.equal(0);
    });

    it('unsoldUMB should be 0', async () => {
      expect(await contract.unsoldUMB()).to.equal(0);
    });

    describe('when started', () => {
      beforeEach(async () => {
        await mockBalanceOf(contract.address, totalUMBOnSale.toString(10));
        await contract.connect(owner).start();
      });

      it('expect to have all unsoldUMB tokens yet', async () => {
        expect(await contract.unsoldUMB()).to.equal(totalUMBOnSale);
      });

      describe('when auction over', () => {
        beforeEach(async () => {
          await contract.connect(owner).stop();
        });

        it('unsoldUMB should be all', async () => {
          expect(await contract.unsoldUMB()).to.equal(totalUMBOnSale);
        });
      });

      describe('when we do not have minimal locked eth', () => {
        beforeEach(async () => {
          const tx = await owner.sendTransaction({to: contract.address, value: '0x1'});
          await waitForTx(tx.hash, provider);
          await contract.connect(owner).stop();
        });

        it('expect auction not to be successful', async () => {
          expect(await contract.wasAuctionSuccessful()).to.be.false;
        });

        it('expect all tokens to be unsold', async () => {
          expect(await contract.unsoldUMB()).to.equal(totalUMBOnSale);
        });
      });
    });
  });
});
