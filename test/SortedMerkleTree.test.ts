import SortedMerkleTree from '../lib/SortedMerkleTree';

describe('SortedMerkleTree', async () => {
  it('Should create a contract with an assigned owner', async () => {
    const sortedMerkleTree = new SortedMerkleTree(
      ['0xF6a576FB45B88bCBFACfF67f8D4CCaDBc5aF8413', '0xA73574d3a0f3aF8C13b3389f7d6B5DFB22443571']);

    console.log(sortedMerkleTree.root());

    console.log(sortedMerkleTree.proof('0xF6a576FB45B88bCBFACfF67f8D4CCaDBc5aF8413'));

    console.log(SortedMerkleTree.verifyProof(
      sortedMerkleTree.proof('0xF6a576FB45B88bCBFACfF67f8D4CCaDBc5aF8413'),
      sortedMerkleTree.root()!,
      '0xF6a576FB45B88bCBFACfF67f8D4CCaDBc5aF8413',
    ));
  });
});
