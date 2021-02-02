import hre from 'hardhat';

const {ethers, getNamedAccounts} = hre;

async function main() {
  const contract = await ethers.getContractFactory('UMB777');
  const [owner, holder] = await ethers.getSigners();

  console.log('deploy');
  const UMB = await contract.deploy(
    owner.address,
    holder.address,
    0,
    1000000,
    'Umbrella ERC777 Token',
    'UMB'
  );

  await UMB.deployed();

  console.log('mint ' + Object.keys(UMB.connect(owner)));
  await UMB.connect(owner)['mint(address,uint256)'](owner.address, 2000);

  console.log('transfer');
  await UMB.connect(owner).transfer(holder.address, 1000);

  console.log('approve');
  await UMB.connect(owner).approve(holder.address, 1000);

  console.log('transferFrom');
  await UMB.connect(holder).transferFrom(owner.address, holder.address, 1000);
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
