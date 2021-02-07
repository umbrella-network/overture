import {loadCSVRewardsDistribution} from './helpers';

const main = async () => {
  const rewards = await loadCSVRewardsDistribution(
    './data/Token distribution for contract deployment settings - Airdrop.csv');

  rewards.forEach((item) => {
    console.log(`${item[0]}: ${item[1]}`)
  });
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
