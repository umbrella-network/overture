import CONFIG from '../config/config';
import {getUmbContract} from './deployers/UMB';
import {getProvider, waitForTx} from './helpers';

async function main() {
  if (!CONFIG.auction.amountOfTokensForAuction) {
    throw Error('`CONFIG.auction.amountOfTokensForAuction` is empty');
  }

  // TODO maybe check balance before minting?

  console.log('\nMinting tokens for auction...\n');
  const provider = getProvider();
  const umb = await getUmbContract();
  const tx = await umb.mint(CONFIG.auction.address, CONFIG.auction.amountOfTokensForAuction);
  await waitForTx(tx.hash, provider);
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
