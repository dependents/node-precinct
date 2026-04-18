'use strict';

const assert = require('assert').strict;
const { suite } = require('uvu');
const precinct = require('../index.js');
const { fixturePath, readFixture } = require('./helpers.js');

const test = suite('configuration');

test('passes amd config to the amd detective', async() => {
  const fixture = await readFixture('amdLazy.js');
  const withLazy = precinct(fixture);
  const withoutLazy = precinct(fixture, {
    amd: {
      skipLazyLoaded: true
    }
  });
  assert.equal(withLazy.includes('./b'), true);
  assert.equal(withoutLazy.includes('./b'), false);
});

test('supports the object form of type configuration', async() => {
  const fixture = await readFixture('styles.styl');
  const result = precinct(fixture, { type: 'stylus' });
  const expected = ['mystyles', 'styles2.styl', 'styles3.styl', 'styles4'];
  assert.deepEqual(result, expected);
});

test('walker options: finds imports inside blocks when allowImportExportEverywhere is enabled', async() => {
  const fixture = await readFixture('es6ImportInsideBlock.js');
  const withoutOption = precinct(fixture);
  assert.equal(withoutOption.length, 0);

  const withOption = precinct(fixture, {
    walker: {
      allowImportExportEverywhere: true
    }
  });
  assert.equal(withOption.includes('lib'), true);
  assert.equal(withOption.length, 1);
});

test('walker options: accepts a custom parser via walker options', async() => {
  const fixture = await readFixture('commonjs.js');

  const prebuiltAst = require('@babel/parser').parse(fixture, {
    sourceType: 'module',
    allowHashBang: true
  });

  let parseCallCount = 0;
  const customParser = {
    parse() {
      parseCallCount++;
      return prebuiltAst;
    }
  };

  const result = precinct(fixture, {
    walker: {
      parser: customParser
    }
  });
  assert.equal(parseCallCount, 1);
  assert.equal(result.includes('./a'), true);
});

test('walker options: passes walker options through paperwork', () => {
  const fixture = fixturePath('es6ImportInsideBlock.js');
  const withoutOption = precinct.paperwork(fixture);
  assert.equal(withoutOption.length, 0);

  const withOption = precinct.paperwork(fixture, {
    walker: {
      allowImportExportEverywhere: true
    }
  });
  assert.equal(withOption.includes('lib'), true);
  assert.equal(withOption.length, 1);
});

test.run();
