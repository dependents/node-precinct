'use strict';

const assert = require('node:assert').strict;
const { suite } = require('uvu');
const precinct = require('../index.js');
const ast = require('./fixtures/exampleAST.js');
const { readFixture } = require('./helpers.js');

const test = suite('AST');

test('accepts an AST', () => {
  const deps = precinct(ast);
  assert.equal(deps.length, 1);
});

test('dangles off a given ast', () => {
  assert.deepEqual(precinct.ast, ast);
});

test('dangles off the parsed ast from a .js file', async() => {
  const fixture = await readFixture('amd.js');
  precinct(fixture);
  assert.notEqual(precinct.ast, null);
  assert.notDeepEqual(precinct.ast, ast);
});

test('dangles off the parsed ast from a scss detective', async() => {
  const fixture = await readFixture('styles.scss');
  precinct(fixture, { type: 'scss' });
  assert.notDeepEqual(precinct.ast, {});
});

test('dangles off the parsed ast from a sass detective', async() => {
  const fixture = await readFixture('styles.sass');
  precinct(fixture, { type: 'sass' });
  assert.notDeepEqual(precinct.ast, {});
});

test.run();
