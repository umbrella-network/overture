import CONFIG from '../config/config';

import hre from 'hardhat';
import {deployUmbMultiSig, multiSigContract} from "./deployers/UmbMultiSig";
import {deployLibStrings} from "./deployers/LibStrings";
import {deployAuction} from "./deployers/Auction";
import {deployUMB, UmbContract} from "./deployers/UMB";
import {getDefaultOwnerBasedOnConfig, getProvider, validationMark, waitForTx} from "./helpers";

const {ethers, getNamedAccounts} = hre;

async function main() {
  const {deployer, multiSigOwner1} = await getNamedAccounts();
  console.log('ENV:', CONFIG.env);
  console.log('DEPLOYING FROM ADDRESS:', deployer);


  if (CONFIG.auction.address) {
    console.log(validationMark())
    console.log('AUCTION IS ALREADY DEPLOYED under', CONFIG.auction.address);
    console.log('if you want to redeploy, delete its address from config file');
    return
  }

  if (CONFIG.UMB.address) {
    console.log(validationMark())
    console.log('UMB IS ALREADY DEPLOYED under', CONFIG.UMB.address);
    console.log('if you want to redeploy stage 0, delete its address from config file');
    return
  }

  const provider = getProvider()
  let owner;
  let multiSig

  if (CONFIG.multiSig.useIt) {
    console.log('MULTISIG IN USE');
    if (!CONFIG.multiSig.address) {
      const libStrings = await deployLibStrings();
      multiSig = await deployUmbMultiSig(libStrings.address);
      owner = multiSig.address
    } else {
      console.log('MultiSig address is already set');
      owner = CONFIG.multiSig.address;
      multiSig = await multiSigContract()
    }
  } else {
    console.log('MULTISIG IS OFF');
    owner = await getDefaultOwnerBasedOnConfig();
  }

  if (!owner) {
    console.log(validationMark(false))
    throw Error('owner is missing')
  }

  console.log('OWNER for contracts:', owner);

  const umb = await deployUMB(owner)
  const auction = await deployAuction(umb.address, owner);

  console.log('TOKEN for auction:', umb.address);

  if (CONFIG.auction.tokensForAuction) {
    if (CONFIG.multiSig.useIt) {
      if (!multiSig) {
        console.log(validationMark())
        throw Error('multiSig contract is not set')
      }

      const multiSigOwner1Wallet = (await ethers.getSigners())[<number>hre.config.namedAccounts.multiSigOwner1];

      if ((await multiSig.ownersPowers(multiSigOwner1)).toString() == '0') {
        console.log(validationMark())
        console.log('Owner for MultiSig is not set or it is invalid, so you need to mint tokens for Auction via Etherscan')
        return
      }

      console.log('fire up tx for mint tokens for auction,',
        'it will succeed only if we have enough power, otherwise other owners needs to confirm');

      // mint tokens for auction
      const tx = await multiSig.connect(multiSigOwner1Wallet).submitTokenMintTx(umb.address, auction.address, CONFIG.auction.tokensForAuction)
      await waitForTx(tx.hash, provider)

      console.log('Tx need additional owners to confirm:', !(await multiSig.isExceuted(0)))
      console.log('Tx details:', await multiSig.getTransaction(0))
    } else {
      // mint tokens for auction
      const [deployerWallet] = await ethers.getSigners();

      const tx = await umb.connect(deployerWallet).mint(auction.address, CONFIG.auction.tokensForAuction)
      await waitForTx(tx.hash, provider)
    }

    console.log('Balance of auction contract:', (await umb.balanceOf(auction.address)).toString())
  } else {
    console.log('`tokensForAuction` is empty, so script did not mint tokens for auction - do it via Etherscan');
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
