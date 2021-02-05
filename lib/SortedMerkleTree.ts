import {ethers} from 'hardhat';

const hashFunc = ethers.utils.solidityKeccak256;
const isOdd = (n: number) => n % 2 !== 0;

export default class SortedMerkleTree {
  layers: string[][] = [];

  constructor(leaves: string[]) {
    leaves = leaves.map(SortedMerkleTree.hashAddress).sort();

    this.layers = this.createLayers(leaves);
  }

  createLayers(leaves: string[]): string[][] {
    if (leaves.length == 0) {
      return [['']];
    }

    const layers: string[][] = [];
    layers.push(leaves);

    while (layers[layers.length - 1].length > 1) {
      layers.push(this.nextLayer(layers[layers.length - 1]));
    }

    return layers;
  }

  nextLayer(elements: string[]): string[] {
    const result = [];
    for (let i = 1; i <= elements.length; i += 2) {
      result.push(i < elements.length ? SortedMerkleTree.hashBytes(elements[i - 1], elements[i]) : elements[i - 1]);
    }

    return result;
  }

  generateProof(idx: number, level = 0, proof: string[] = []): string[] {
    if (level === this.layers.length - 1) {
      return proof;
    }

    const layer = this.layers[level];
    const siblingIdx = idx + (isOdd(idx) ? -1 : +1);
    proof.push(layer[siblingIdx]);

    return this.generateProof(Math.floor(idx / 2), level + 1, proof);
  }

  proof(leaf: string): string[] {
    return this.generateProof(this.layers[0].indexOf(SortedMerkleTree.hashAddress(leaf)));
  }

  root(): string | undefined {
    if (this.layers.length === 0) {
      return;
    }

    return this.layers[this.layers.length - 1][0];
  }

  static hashBytes(h1: string, h2: string): string {
    const sorted = [h1, h2].sort();
    return hashFunc(['bytes32', 'bytes32'], [sorted[0], sorted[1]]);
  }

  static hashAddress(address: string): string {
    return hashFunc(['address'], [address]);
  }

  static verifyProof(proof: string[], root: string, leaf: string): boolean {
    let computedHash = SortedMerkleTree.hashAddress(leaf);

    proof.forEach((proofElement: string) => {
      if (computedHash <= proofElement) {
        computedHash = this.hashBytes(computedHash, proofElement);
      } else {
        computedHash = this.hashBytes(proofElement, computedHash);
      }
    });

    return computedHash === root;
  }
}
