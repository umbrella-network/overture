import fs from 'fs';
import {Contract} from 'ethers';
import {task} from 'hardhat/config';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

import GnosisSafe from './abi/GnosisSafe.json';

const {FORKING_ENV = ''} = process.env;

// current owners of target contracts
const umbMultiSigAddresses: Record<string, string> = {
  bsc: '0xB5E5729184e935125Bd047515c0B05CdD73Cb418', // UmbMultisigBsc
  eth: '0x4A28406ECE8fFd7A91789738a5ac15DAc44bFa1b',
}

// NEW owners of target contracts
const gnosisSafeAddresses: Record<string, string> = {
  bsc: '0x7724411cbD7ab3F9Ce7af882Ce44D2b27890359c',
  eth: '0x1C6262c252731d17e5b3Cb5c569216d59d37d70D',
}

const transactionCount: Record<string, bigint> = {
  bsc: 9n,
  eth: 74n,
}

const targets: Record<string, string[]> = {
  eth: [
    '0x6fc13eace26590b80cccab1ba5d51890577d83b2', // UMB
    // '0xAe9aCa5d20F5b139931935378C4489308394ca2C', // rUMB2, umbDeployer is current owner
  ],
  bsc: [
    '0x846F52020749715F02AEf25b5d1d65e48945649D', // 'UMB'
    // '0x8690666153B101201a104719C3424179730Ac2bc', // rUMB2BSC, umbDeployer is current owner
  ],
}

const confirmTx = async (hre: HardhatRuntimeEnvironment, targetId: number) => {
  const powerWallet = '0x8558fCFE23E53A9555D8aBf5544c9EFc1F108f3e';

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [powerWallet],
  });

  const powerSigner = await hre.ethers.getSigner(powerWallet);

  const UmbMultiSig = await hre.artifacts.readArtifact('UmbMultiSig');
  const umbMultiSig = new Contract(umbMultiSigAddresses[FORKING_ENV], UmbMultiSig.abi, powerSigner);

  console.log('confirming tx...');
  await umbMultiSig.confirmTransaction(transactionCount[FORKING_ENV] + BigInt(targetId));
}

export async function transferOwnership(hre: HardhatRuntimeEnvironment, targetId: number): Promise<void> {
  const networkName = hre.network.name === 'localhost' ? FORKING_ENV : hre.network.name;
  const [signer] = await hre.ethers.getSigners();
  const target = targets[networkName][targetId];

  if (!target) {
    throw Error('empty target contract');
  }

  const Ownable = await hre.artifacts.readArtifact('Ownable');
  const UmbMultiSig = await hre.artifacts.readArtifact('UmbMultiSig');

  const gnosisSafe = new Contract(gnosisSafeAddresses[networkName], GnosisSafe.abi, hre.ethers.provider);
  const umbMultiSig = new Contract(umbMultiSigAddresses[networkName], UmbMultiSig.abi, signer);
  const targetContract = new Contract(target, Ownable.abi, hre.ethers.provider);

  const targetCurrentOwner = await targetContract.owner();

  if (targetCurrentOwner == gnosisSafe.address) {
    throw Error(`new owner (${gnosisSafe.address}) already set for ${target}`);
  }

  if (targetCurrentOwner != umbMultiSig.address) {
    throw Error(`umbMultiSig is not owner of ${target}: ${targetCurrentOwner} vs ${umbMultiSig.address}`);
  }

  const txCount = await umbMultiSig.transactionCount();
  const expectedTxCount = transactionCount[networkName] + BigInt(targetId);

  if (txCount.toBigInt() != expectedTxCount) {
    throw Error(`transactionCount: ${txCount.toBigInt()}, but expected ${expectedTxCount}`);
  }

  const gnosisOwners: string[] = await gnosisSafe.getOwners();
  console.log({gnosisOwners});

  if (!gnosisOwners.includes(signer.address)) {
    throw Error(`signer ${signer.address} is not part of gnosis wallet`);
  }

  const umbMultisigOwners: string[] = await Promise.all([
    umbMultiSig.owners(0),
    umbMultiSig.owners(1),
    umbMultiSig.owners(2),
  ]);

  console.log({umbMultisigOwners});

  if (!umbMultisigOwners.includes(signer.address)) {
    throw Error(`signer (${signer.address}) is not part of umbMultiSig wallet`);
  }

  const flag = `${__dirname}/_transferOwnership_${target}_${hre.network.name}${FORKING_ENV}.txt`;

  if (fs.existsSync(flag)) {
    console.log('\nTX IN PROGRESS OR REMOVE THIS FILE AND RUN SCRIPT AGAIN:\n')
    console.log(flag);
    return;
  }

  const t = Math.trunc(Date.now() / 1000);
  fs.writeFileSync(flag, t.toString(10));

  if (hre.network.name !== 'localhost') {
    const executeOnNetwork = `EXECUTE_${hre.network.name.toUpperCase()}`;

    if (!process.env[executeOnNetwork]) {
      throw Error(`env.${executeOnNetwork} is empty, set it to enable mainnet execution`);
    }

    const executeT = parseInt(process.env[executeOnNetwork] || '0', 10);

    if (isNaN(executeT)) {
      throw Error(`${executeOnNetwork} NaN`);
    }

    if (executeT + 30 < t) {
      throw Error(`set ${executeOnNetwork} to current timestamp (${t}) to enable mainnet execution`);
    }
  }

  console.log('preparing transfer for', targetContract.address);

  const iface = new hre.ethers.utils.Interface(Ownable.abi);
  const calldata = iface.encodeFunctionData('transferOwnership', [gnosisSafe.address]);
  const tx = await umbMultiSig.submitTransaction(targetContract.address, 0, calldata);
  console.log('tx', tx.hash);
  await tx.wait(1);

  // this is QA process, only for forking network
  if (hre.network.name === 'localhost') {
    await confirmTx(hre, targetId);
    const newOwner = await targetContract.owner();

    if (newOwner == gnosisSafe.address) {
      console.log('gnosisSafe is new owner!');
    } else {
      throw Error(`gnosisSafe is not owner! of ${target}: ${newOwner} vs ${gnosisSafe.address}`);
    }
  }
}

/*
QA:
npx hardhat node
npx hardhat transfer-ownership --network localhost
npx hardhat transfer-ownership --network eth
npx hardhat transfer-ownership --network bsc

Transfering UMB ownership to new gnosis multisig

ETH:
https://etherscan.io/tx/0xa58ecef83f1f3bf6c4570c9e849dae5653e9a481d11907e6c08f10f01e5b72dc
ID: 74

https://bscscan.com/tx/0x4a1ee217efe262a9ab389df2aa11bb6719dadd4d45ff6f52fed4fce2d2fd2428
ID: 9

 */
task('transfer-ownership', 'Transfers ownership from old to new multisig')
  .setAction(async (taskArgs, hre) => {
    const networkName = hre.network.name === 'localhost' ? FORKING_ENV : hre.network.name;
    console.log({networkName, hreName: hre.network.name})

    for (const i of Object.keys(targets[networkName])) {
      const id = parseInt(i, 10);
      console.log('executing transferOwnership for target', i, targets[networkName][id])
      await transferOwnership(hre, id);
    }

    console.log('DONE.');
  });
