import fs from 'fs';
import os from 'os';
import path from 'path';
import web3 from 'web3';
import {expect} from 'chai';
import {loadCSVRewardsDistribution} from '../scripts/helpers';

describe('.loadCSVRewardsDistribution()', () => {
  let content: string;
  before(() => {
    content = fs.readFileSync('test/data/airdrop.csv').toString();
  });

  const createTemp = (content: string) => {
    const dir = path.join(os.tmpdir(), 'overture' + web3.utils.randomHex(16))
    fs.writeFileSync(dir, content);
    return dir;
  };

  it('expect to load csv', async () => {
    expect((await loadCSVRewardsDistribution(
      'test/data/airdrop.csv')).length).equals(7);
  });

  it('expect reject csv with invalid total', async () => {
    try {
      await loadCSVRewardsDistribution(createTemp(content.replace('101,772', '101,771')));
      return Promise.reject();
    } catch (e) {
      return Promise.resolve();
    }
  });

  it('expect reject csv with malformed address', async () => {
    try {
      await loadCSVRewardsDistribution(createTemp(
        content.replace('0xB3b7874F13387D44a3398D298B075B7A3505D8d4', '0xb3b7874F13387D44a3398D298B075B7A3505D8d4')));
      return Promise.reject();
    } catch (e) {
      return Promise.resolve();
    }
  });
});

