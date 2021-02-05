import hre from 'hardhat';
import SortedMerkleTree from '../lib/SortedMerkleTree';
import web3 from 'web3';

const {ethers} = hre;

async function main() {
  const [owner, holder] = await ethers.getSigners();

  const umbContract = await ethers.getContractFactory('UMB');
  const UMB = await umbContract.deploy(
    owner.address,
    owner.address,
    50000,
    50000,
    'UMB Token',
    'UMB'
  );

  await UMB.deployed();

  const contract = await ethers.getContractFactory('UMBAirdrop');
  const UMBAirdrop = await contract.deploy(
    owner.address,
    UMB.address,
  );

  await UMBAirdrop.deployed();

  await UMB.transfer(UMBAirdrop.address, 50000);

  const addresses = new Array(500).fill(0).map(() => web3.utils.randomHex(4));
  addresses[0] = owner.address;

  const sortedMerkleTree = new SortedMerkleTree(addresses);

  await UMBAirdrop.registerAirdrop(sortedMerkleTree.root(), 100);

  const proof = sortedMerkleTree.proof(owner.address);

  for (let i = 0; i < 500; ++i) {
    await UMBAirdrop.receiveAirdrop(0, proof)
  }

  //const addresses = new Array(1500).fill(owner.address);

  //await UMBAirdrop.executeDirectAirdrop(addresses, 1);

  console.log(await UMB.balanceOf(owner.address));
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
