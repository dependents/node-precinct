'use strict';

const assert = require('node:assert').strict;
const { suite } = require('uvu');
const precinct = require('../index.js');
const { fixturePath } = require('./helpers.js');

const test = suite('paperwork');

test('grabs dependencies of jsx files', () => {
  const fixture = fixturePath('module.jsx');
  const result = precinct.paperwork(fixture);
  const expected = ['./es6NoImport'];
  assert.deepEqual(result, expected);
});

test('uses fileSystem from options if provided', () => {
  const fsMock = {
    readFileSync(filePath) {
      assert.equal(filePath, '/foo.js');
      return 'var assert = require("assert");';
    }
  };

  const fixture = '/foo.js';
  const results = precinct.paperwork(fixture, { fileSystem: fsMock });
  assert.equal(results.length, 1);
  assert.equal(results[0], 'assert');
});

test('returns the dependencies for the given filepath', () => {
  const fixtures = ['es6.js', 'styles.scss', 'typescript.ts', 'styles.css'];

  for (const fixture of fixtures) {
    const result = precinct.paperwork(fixturePath(fixture));
    assert.notEqual(result.length, 0);
  }
});

test('throws if the file cannot be found', () => {
  assert.throws(() => {
    precinct.paperwork('foo');
  });
});

test('filters out core modules if options.includeCore is false', () => {
  const fixture = fixturePath('coreModules.js');
  const result = precinct.paperwork(fixture, { includeCore: false });
  assert.equal(result.length, 0);
});

test('does not filter out core modules by default', () => {
  const fixture = fixturePath('coreModules.js');
  const result = precinct.paperwork(fixture);
  assert.notEqual(result.length, 0);
});

test('handles cjs files as commonjs', () => {
  const fixture = fixturePath('commonjs.cjs');
  const result = precinct.paperwork(fixture);
  assert.equal(result.includes('./a'), true);
  assert.equal(result.includes('./b'), true);
});

test('passes detective configuration to the underlying detective', () => {
  const fixture = fixturePath('amdLazy.js');
  const withLazy = precinct.paperwork(fixture);
  const withoutLazy = precinct.paperwork(fixture, {
    amd: {
      skipLazyLoaded: true
    }
  });
  assert.equal(withLazy.includes('./b'), true);
  assert.equal(withoutLazy.includes('./b'), false);
});

test('does not filter out core modules by default when given detective configuration', () => {
  const fixture = fixturePath('coreModules.js');
  const result = precinct.paperwork(fixture, {
    amd: {
      skipLazyLoaded: true
    }
  });
  assert.notEqual(result.length, 0);
});

test.run();
