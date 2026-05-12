'use strict';

const assert = require('node:assert').strict;
const { suite } = require('uvu');
const precinct = require('../index.js');
const { readFixture } = require('./helpers.js');

const test = suite('AMD');

test('grabs dependencies', async() => {
  const fixture = await readFixture('amd.js');
  const result = precinct(fixture);
  assert.equal(result.includes('./a'), true);
  assert.equal(result.includes('./b'), true);
  assert.equal(result.length, 2);
});

test.run();
