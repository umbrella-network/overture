import 'hardhat'; // require for IntelliJ to run tests
import '@nomiclabs/hardhat-waffle'; // require for IntelliJ to run tests

import {expect} from 'chai';
import {humanNumberToWei, numberToWei} from './utils';

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


describe('.fromHumanToWei()', () => {
  [
    {n: '1', result: '1' + '0'.repeat(18)},
    {n: '999.123', result: '999123' + '0'.repeat(15)},
    {n: '999,123', result: '999123' + '0'.repeat(18), unit: undefined},
  ].forEach(testCase => {
    const {n, result, unit} = testCase;

    it(`expect to convert ${n} into ${result}`, () => {
      expect(humanNumberToWei(n, unit)).to.equal(result);
    });
  })
});
