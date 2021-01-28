import CONFIG from '../config/config';

import hre from 'hardhat';
import {deployUmbMultiSig, multiSigContract} from "./deployers/UmbMultiSig";
import {deployLibStrings} from "./deployers/LibStrings";
import {deployUMB} from "./deployers/UMB";
import {
  checkTxSubmission,
  currentTimestamp,
  getProvider,
  validationMark,
  waitForTx, wasTxExecutedByMultiSig
} from "./helpers";

const {ethers, getNamedAccounts} = hre;

async function main() {
  const {deployer} = await getNamedAccounts();
  const multiSigOwnerWallet = (await ethers.getSigners())[<number>hre.config.namedAccounts.deployer];

  if (!multiSigOwnerWallet) {
    throw Error('multiSigOwnerWallet is not set, check `hardhat.config` and setup .env');
  }

  console.log(`\n\n${'-'.repeat(80)}\nSCRIPT STARTS AT: ${currentTimestamp}\n\n`);
  console.log('ENV:', CONFIG.env);
  console.log('DEPLOYING FROM ADDRESS:', deployer, `\n\n`);

  if (!CONFIG.auction.address) {
    console.log(validationMark());
    console.log('MISSING POLKASTARTER WALLET');
    return;
  }

  if (CONFIG.UMB.address) {
    console.log(validationMark());
    console.log('UMB IS ALREADY DEPLOYED under', CONFIG.UMB.address);
    console.log('if you want to redeploy stage 0, delete its address from config file');
    return;
  }

  const provider = getProvider();
  let multiSig;

  if (!CONFIG.multiSig.address) {
    const libStrings = CONFIG.libs.strings || (await deployLibStrings()).address;
    multiSig = await deployUmbMultiSig(libStrings);
  } else {
    console.log('MultiSig address is already set');
    multiSig = await multiSigContract();
  }

  const umb = await deployUMB(multiSig.address);

  console.log('TOKEN for auction:', umb.address);

  if (CONFIG.auction.amountOfTokensForAuction) {
    if (!multiSig) {
      console.log(validationMark());
      throw Error('multiSig contract is not set');
    }

    if ((await multiSig.ownersPowers(deployer)).toString() === '0') {
      console.log(validationMark());
      console.log('Owner for MultiSig is not set or it is invalid, so you need to mint tokens for Auction via Etherscan');
      return;
    }

    console.log(`\nMinting tokens for auction...\n`);

    const tx = await multiSig
      .connect(multiSigOwnerWallet)
      .submitTokenMintTx(umb.address, CONFIG.auction.address, CONFIG.auction.amountOfTokensForAuction);

    let txId = checkTxSubmission(multiSig, await waitForTx(tx.hash, provider));
    await wasTxExecutedByMultiSig(multiSig, txId);

    console.log('Balance of auction contract:', (await umb.balanceOf(CONFIG.auction.address)).toString());
  } else {
    console.log('`CONFIG.auction.amountOfTokensForAuction` is empty, so script did not mint tokens for auction - do it via Etherscan');
  }
}

main()
  .then(() => {
    console.log(`\n\nDONE.\n${'='.repeat(80)}\n`);
    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
