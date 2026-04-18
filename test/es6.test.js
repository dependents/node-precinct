'use strict';

const assert = require('assert').strict;
const { suite } = require('uvu');
const precinct = require('../index.js');
const { fixturePath, readFixture } = require('./helpers.js');

const test = suite('ES6');

test('grabs dependencies', async() => {
  const fixture = await readFixture('es6.js');
  const result = precinct(fixture);
  assert.equal(result.includes('lib'), true);
  assert.equal(result.length, 1);
});

test('grabs dependencies with embedded jsx', async() => {
  const fixture = await readFixture('jsx.js');
  const result = precinct(fixture);
  assert.equal(result.includes('lib'), true);
  assert.equal(result.length, 1);
});

test('grabs dependencies with embedded es7', async() => {
  const fixture = await readFixture('es7.js');
  const result = precinct(fixture);
  assert.equal(result.includes('lib'), true);
  assert.equal(result.length, 1);
});

test('handles the esm extension', () => {
  const fixture = fixturePath('es6.esm');
  const result = precinct.paperwork(fixture);
  assert.equal(result.includes('lib'), true);
  assert.equal(result.length, 1);
});

test('handles the mjs extension', () => {
  const fixture = fixturePath('es6.mjs');
  const result = precinct.paperwork(fixture);
  assert.equal(result.includes('lib'), true);
  assert.equal(result.length, 1);
});

test('yields no dependencies when there are no imports', async() => {
  const fixture = await readFixture('es6NoImport.js');
  const result = precinct(fixture);
  assert.equal(result.length, 0);
});

test('does not grab dependencies when there are syntax errors', async() => {
  const fixture = await readFixture('es6WithError.js');
  const result = precinct(fixture);
  assert.equal(result.length, 0);
});

test('grabs dynamic imports', async() => {
  const fixture = await readFixture('es6DynamicImport.js');
  const result = precinct(fixture);
  assert.equal(result[0], './bar');
});

test('mixed imports: returns both commonjs and es6 dependencies for es6 files', async() => {
  const fixture = await readFixture('es6MixedImport.js');
  const result = precinct(fixture, {
    es6: {
      mixedImports: true
    }
  });
  assert.equal(result.length, 2);
});

test('mixed imports: returns both commonjs and es6 dependencies for cjs files', async() => {
  const fixture = await readFixture('cjsMixedImport.js');
  const result = precinct(fixture, {
    es6: {
      mixedImports: true
    }
  });
  assert.equal(result.length, 2);
});

test('mixed imports: grabs lazy cjs exports when mixedImports is enabled', async() => {
  const fixture = await readFixture('es6MixedExportLazy.js');
  const result = precinct(fixture, {
    es6: {
      mixedImports: true
    }
  });
  assert.equal(result[0], './amd');
  assert.equal(result[1], './es6');
  assert.equal(result[2], './es7');
  assert.equal(result.length, 3);
});

test('mixed imports: does not grab lazy cjs exports when mixedImports is disabled', async() => {
  const fixture = await readFixture('es6MixedExportLazy.js');
  const result = precinct(fixture);
  assert.equal(result.length, 0);
});

test('node: prefix: assumes node:-prefixed builtins exist', () => {
  const fixture = fixturePath('internalNodePrefix.js');
  const result = precinct.paperwork(fixture, { includeCore: false });
  assert.equal(result.includes('node:nonexistant'), false);
  assert.deepEqual(result, ['streams']);
});

test('node: prefix: does not filter out node:-prefixed builtins by default', () => {
  const fixture = fixturePath('nodeBuiltinPrefix.js');
  const result = precinct.paperwork(fixture);
  assert.equal(result.includes('node:fs'), true);
  assert.equal(result.includes('node:path'), true);
});

test('node: prefix: understands quirks around modules only addressable via node: prefix', () => {
  const fixture = fixturePath('requiretest.js');
  const result = precinct.paperwork(fixture, { includeCore: false });
  assert.deepEqual(result, ['test']);
});

test('node: prefix: filters out node:-prefixed builtins when includeCore is false', () => {
  const fixture = fixturePath('nodeBuiltinPrefix.js');
  const result = precinct.paperwork(fixture, { includeCore: false });
  assert.deepEqual(result, ['./myModule']);
});

test.run();
