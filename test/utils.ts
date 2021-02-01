import {BigNumber} from 'ethers';
import {ethers} from 'hardhat';

export const numberToWei = (n: number | string, decimals = 18): string => {
  const parts = n.toString(10).split('.');
  const wei = BigNumber.from(parts[0]).mul(BigNumber.from(10).pow(decimals));

  if (!parts[1] || parts[1].length === 0 || parseInt(parts[1], 10) === 0) {
    return wei.toString();
  }

  return wei.add(BigNumber.from(parts[1]).mul(BigNumber.from(10).pow(decimals - parts[1].length))).toString();
};

export const mintBlock = async (): Promise<void> => ethers.provider.send('evm_mine', []);

export const blockTimestamp = async (): Promise<number> => {
  const block = await ethers.provider.getBlock('latest');
  return block.timestamp;
};
