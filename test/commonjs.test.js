'use strict';

const assert = require('assert').strict;
const { suite } = require('uvu');
const precinct = require('../index.js');
const { readFixture } = require('./helpers.js');

const test = suite('CommonJS');

test('grabs dependencies', async() => {
  const fixture = await readFixture('commonjs.js');
  const result = precinct(fixture);
  assert.equal(result.includes('./a'), true);
  assert.equal(result.includes('./b'), true);
  assert.equal(result.length, 2);
  assert.deepEqual(precinct(fixture, { type: 'cjs' }), result);
});

test('grabs lazy exported dependencies', async() => {
  const fixture = await readFixture('cjsExportLazy.js');
  const result = precinct(fixture);
  assert.equal(result[0], './amd');
  assert.equal(result[1], './es6');
  assert.equal(result[2], './es7');
  assert.equal(result.length, 3);
});

test('grabs dependencies when a main require is used', async() => {
  const fixture = await readFixture('commonjs-requiremain.js');
  const result = precinct(fixture);
  assert.equal(result[0], './b');
  assert.equal(result.length, 1);
});

test('yields no dependencies for non-modules', async() => {
  const fixture = await readFixture('none.js');
  const result = precinct(fixture);
  assert.equal(result.length, 0);
});

test('ignores unparsable .js files', async() => {
  const fixture = await readFixture('unparseable.js');
  const result = precinct(fixture);
  assert.equal(result.includes('lib'), false);
  assert.equal(result.length, 0);
});

test('does not throw on unparsable .js files', async() => {
  const fixture = await readFixture('unparseable.js');
  assert.doesNotThrow(() => {
    precinct(fixture);
  }, SyntaxError);
});

test('does not blow up when parsing a gruntfile #2', async() => {
  const fixture = await readFixture('Gruntfile.js');
  assert.doesNotThrow(() => {
    precinct(fixture);
  });
});

test.run();
