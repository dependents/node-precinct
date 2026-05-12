'use strict';

const assert = require('node:assert').strict;
const { suite } = require('uvu');
const precinct = require('../index.js');
const { fixturePath } = require('./helpers.js');

const test = suite('Vue');

test('grabs dependencies from typescript/scss files', () => {
  const result = precinct.paperwork(fixturePath('ts.vue'));
  assert.equal(result[0], './typescript');
  assert.equal(result[1], 'styles.scss');
  assert.equal(result.length, 2);
});

test('grabs dependencies from javascript/sass files', () => {
  const result = precinct.paperwork(fixturePath('js.vue'));
  assert.equal(result[0], './typescript');
  assert.equal(result[1], 'styles.scss');
  assert.equal(result.length, 2);
});

test.run();
