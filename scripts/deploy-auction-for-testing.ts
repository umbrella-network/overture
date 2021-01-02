import CONFIG from '../config/config';
import {deployAuction} from "./deployers/Auction";
import hre from "hardhat";
import {getDefaultOwner, getProvider, waitForTx} from "./helpers";

const { toWei } = hre.web3.utils;
const { ethers, getNamedAccounts } = hre;

console.log('NETWORK:', hre.network.name);

async function main () {
  const {deployer} = await getNamedAccounts();
  console.log('ENV:', CONFIG.env);
  console.log('DEPLOYING FROM ADDRESS:', deployer);

  const provider = getProvider();

  // console.log('deployer balance:', (await deployer.getBalance()).toString());

  let token;

  if (!CONFIG.UMB.address) {
    const TokenContract = await ethers.getContractFactory('AuctionDummyToken');
    token = await TokenContract.deploy();
    await token.deployed();
    console.log('AuctionDummyToken deployed to:', token.address);
  } else {
    console.log('reusing Token:', CONFIG.UMB.address);
    const TokenContract = require('../artifacts/UMB');
    token = new ethers.Contract(CONFIG.UMB.address, TokenContract.abi, provider);
  }

  const auction = await deployAuction(token.address, await getDefaultOwner());

  const tx = await token.mint(auction.address, toWei('50000', 'ether'));
  await waitForTx(tx.hash, provider);

  // tx = await UMBAuction.setup((await UMBAuction.centsToWeiPrice(50000, 2)).toString(), 10000000000000000);
  // await waitForTx(tx.hash, provider);

  console.log('Tokens on Auction: ', (await token.balanceOf(auction.address)).toString());
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });


/*

0x1Ba0Dbfb0c1B9aedb17745Ec5E625d6179aa2fD7
0x902066e8620e989814c249f090fa29b2cf85b23b
0xC9291c67306389a798607126f15D7aAa3D07891C

 */
