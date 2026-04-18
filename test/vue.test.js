'use strict';

const assert = require('assert').strict;
const { suite } = require('uvu');
const precinct = require('../index.js');
const { fixturePath } = require('./helpers.js');

const test = suite('Vue');

test('grabs dependencies from typescript/scss files', () => {
  const vueFile = precinct.paperwork(fixturePath('ts.vue'));
  assert.equal(vueFile[0], './typescript');
  assert.equal(vueFile[1], 'styles.scss');
  assert.equal(vueFile.length, 2);
});

test('grabs dependencies from javascript/sass files', () => {
  const vueFile = precinct.paperwork(fixturePath('js.vue'));
  assert.equal(vueFile[0], './typescript');
  assert.equal(vueFile[1], 'styles.scss');
  assert.equal(vueFile.length, 2);
});

test.run();
