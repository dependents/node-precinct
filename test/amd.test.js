import { strict as assert } from 'node:assert';
import { suite } from 'uvu';
import precinct from '../index.js';
import { readFixture } from './helpers.js';

const test = suite('AMD');

test('grabs dependencies', async() => {
  const fixture = await readFixture('amd.js');
  const result = precinct(fixture);
  assert.equal(result.includes('./a'), true);
  assert.equal(result.includes('./b'), true);
  assert.equal(result.length, 2);
});

test.run();
