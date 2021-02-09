import {expect} from 'chai';
import {numberToWei} from './utils';

describe('.numberToWei()', () => {
  [
    {n: 1, result: '1000000', decimals: 6},
    {n: 999.123, result: '999123000000000000000', decimals: 18},
  ].forEach(testCase => {
    const {n, result, decimals} = testCase;

    it(`expect to convert ${n} into ${result}`, () => {
      expect(numberToWei(n, decimals)).to.equal(result);
    });
  })
});

