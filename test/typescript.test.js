'use strict';

const assert = require('assert').strict;
const { suite } = require('uvu');
const precinct = require('../index.js');
const { readFixture } = require('./helpers.js');

const test = suite('TypeScript');

test('grabs dependencies of ts files', async() => {
  const fixture = await readFixture('typescript.ts');
  const result = precinct(fixture, { type: 'ts' });
  const expected = ['fs', 'lib', './bar', './my-module.js', './ZipCodeValidator'];
  assert.deepEqual(result, expected);
});

test('grabs dependencies of tsx files', async() => {
  const fixture = await readFixture('module.tsx');
  const result = precinct(fixture, { type: 'tsx' });
  const expected = ['./none'];
  assert.deepEqual(result, expected);
});

test('does not grab dependencies when there are syntax errors', async() => {
  const fixture = await readFixture('typescriptWithError.ts');
  const result = precinct(fixture);
  assert.equal(result.length, 0);
});

test.run();
