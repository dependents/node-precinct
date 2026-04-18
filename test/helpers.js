'use strict';

const { readFile } = require('fs/promises');
const path = require('path');

function fixturePath(filename) {
  return path.join(__dirname, 'fixtures', filename);
}

async function readFixture(filename) {
  return readFile(fixturePath(filename), 'utf8');
}

module.exports = {
  fixturePath,
  readFixture
};
